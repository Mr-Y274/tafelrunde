import { db, ready } from "./db";
import { PublicError } from "./errors";
import { gameInfo } from "./games/catalog";
import { applyMatch, assertAction, createMatch, forfeit, tickMatch, viewMatch } from "./games/engine";
import type { CityId } from "./games/city-maps";
import type { GameId, GameState, Tempo } from "./games/types";
import type { Command } from "./parse";
import type { TablePayload, TischData } from "./payload";

const CODE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function chosenCity(value: unknown): CityId {
  return value === "paris" || value === "barcelona" ? value : "london";
}

type GameRow = {
  id: string;
  code: string;
  type: GameId;
  host_id: string;
  status: "lobby" | "playing" | "finished";
  state: GameState | Record<string, never>;
  options: { tempo?: Tempo; city?: CityId };
  version: number;
};

type SeatRow = { user_id: string; seat: number; ready: boolean; name: string };

function seatName(name: string | null | undefined) {
  const clean = name?.trim();
  return clean && clean.length > 0 ? clean : "honeyheart";
}

function asJson<T>(value: unknown, fallback: T): T {
  if (typeof value === "string") return JSON.parse(value) as T;
  if (value == null) return fallback;
  return value as T;
}

function uniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505";
}

function makeCode() {
  let code = "";
  for (let i = 0; i < 6; i++) code += CODE[Math.floor(Math.random() * CODE.length)];
  return code;
}

async function gameById(id: string): Promise<GameRow | null> {
  const rows = await db()`SELECT id, code, type, host_id, status, state, options, version FROM games WHERE id = ${id}`;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  const info = gameInfo(String(row.type));
  if (!info) return null;
  return {
    id: String(row.id),
    code: String(row.code),
    type: info.id,
    host_id: String(row.host_id),
    status: row.status as GameRow["status"],
    state: asJson(row.state, {}),
    options: asJson(row.options, { tempo: "kurz" }),
    version: Number(row.version),
  };
}

async function seatsOf(gameId: string) {
  const rows = await db()`
    SELECT gp.user_id, gp.seat, gp.ready, guests.name
    FROM game_players gp
    LEFT JOIN guests ON guests.id = gp.user_id
    WHERE gp.game_id = ${gameId}
    ORDER BY gp.seat
  `;
  return (rows as { user_id: string; seat: number; ready: boolean; name: string | null }[]).map((row) => ({
    user_id: row.user_id,
    seat: Number(row.seat),
    ready: Boolean(row.ready),
    name: seatName(row.name),
  }));
}

function paintNames(state: GameState, seats: SeatRow[]) {
  if (!("players" in state) || !Array.isArray(state.players)) return;
  const names = new Map(seats.map((seat) => [seat.user_id, seat.name]));
  for (const player of state.players) {
    const name = names.get(player.id);
    if (name) player.name = name;
  }
}

async function bump(id: string) {
  await db()`UPDATE games SET version = version + 1, updated_at = now() WHERE id = ${id}`;
}

async function commit(id: string, version: number, status: string, state: unknown, options: unknown) {
  const rows = await db()`
    UPDATE games
    SET state = ${JSON.stringify(state)}::jsonb,
        status = ${status},
        options = ${JSON.stringify(options ?? { tempo: "kurz" })}::jsonb,
        version = version + 1,
        updated_at = now()
    WHERE id = ${id} AND version = ${version}
    RETURNING version
  `;
  const row = rows[0] as { version: number } | undefined;
  return row ? Number(row.version) : undefined;
}

async function withTick(game: GameRow, depth = 0): Promise<GameRow> {
  if (game.status !== "playing" || depth > 2) return game;
  const state = structuredClone(game.state) as GameState;
  if (!state.kind || !tickMatch(state)) return game;
  const status = state.phase === "done" ? "finished" : "playing";
  const version = await commit(game.id, game.version, status, state, game.options);
  if (!version) {
    const fresh = await gameById(game.id);
    if (!fresh) throw new PublicError("Diesen Tisch gibt es nicht.", 404);
    return withTick(fresh, depth + 1);
  }
  return { ...game, state, status, version };
}

function turnFor(view: NonNullable<TablePayload["view"]>) {
  if (view.kind === "pictionary") return view.youDraw || view.youCanGuess;
  if (view.kind === "uno") return view.youAreUp || view.canCatch;
  return view.youAreUp;
}

function present(game: GameRow, seats: SeatRow[], userId: string): TablePayload {
  const state = game.status === "lobby" ? null : (game.state as GameState);
  if (state?.kind) paintNames(state, seats);
  const view = state?.kind ? viewMatch(state, userId) : null;
  return {
    id: game.id,
    code: game.code,
    type: game.type,
    status: game.status,
    hostId: game.host_id,
    version: game.version,
    tempo: game.options.tempo === "voll" ? "voll" : "kurz",
    city: chosenCity(game.options.city),
    players: seats.map((seat) => ({
      id: seat.user_id,
      name: seat.name,
      seat: Number(seat.seat),
      ready: Boolean(seat.ready),
    })),
    you: userId,
    access: "player",
    view,
    yourTurn: view ? turnFor(view) : false,
  };
}

export async function loadTisch(userId: string): Promise<TischData> {
  await ready();
  const tables = await db()`
    SELECT g.id, g.code, g.type, g.status, count(gp.user_id)::int AS seats
    FROM games g
    JOIN game_players mine ON mine.game_id = g.id AND mine.user_id = ${userId}
    JOIN game_players gp ON gp.game_id = g.id
    WHERE g.status <> 'finished'
    GROUP BY g.id
    ORDER BY max(g.updated_at) DESC
  `;
  return {
    tables: (tables as { id: string; code: string; type: string; status: string; seats: number }[]).flatMap((row) => {
      const info = gameInfo(row.type);
      if (!info) return [];
      return [{ id: row.id, code: row.code, type: info.id, status: row.status, seats: Number(row.seats) }];
    }),
  };
}

export async function createTable(userId: string, type: string) {
  await ready();
  const info = gameInfo(type);
  if (!info) throw new PublicError("Dieses Spiel gibt es nicht.");
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    try {
      const rows = await db()`
        INSERT INTO games (code, type, host_id, status, state, options)
        VALUES (${code}, ${info.id}, ${userId}, 'lobby', '{}'::jsonb, '{"tempo":"kurz"}'::jsonb)
        RETURNING id
      `;
      const id = String((rows[0] as { id: string }).id);
      await db()`INSERT INTO game_players (game_id, user_id, seat, ready) VALUES (${id}, ${userId}, 0, true)`;
      return { id };
    } catch (error) {
      if (!uniqueViolation(error)) throw error;
    }
  }
  throw new PublicError("Der Tischcode war gerade vergeben. Nochmal.");
}

async function addPlayer(game: GameRow, userId: string) {
  const info = gameInfo(game.type)!;
  const seats = await seatsOf(game.id);
  if (seats.some((seat) => seat.user_id === userId)) return;
  if (seats.length >= info.max) throw new PublicError("Der Tisch ist voll.");
  try {
    await db()`
      INSERT INTO game_players (game_id, user_id, seat, ready)
      SELECT ${game.id}, ${userId}, coalesce(max(seat), -1) + 1, false
      FROM game_players WHERE game_id = ${game.id}
      ON CONFLICT (game_id, user_id) DO NOTHING
    `;
  } catch (error) {
    if (uniqueViolation(error)) throw new PublicError("Versuch es noch einmal.");
    throw error;
  }
  const counts = await db()`SELECT count(*)::int AS n FROM game_players WHERE game_id = ${game.id}`;
  if (Number((counts[0] as { n: number }).n) > info.max) {
    await db()`DELETE FROM game_players WHERE game_id = ${game.id} AND user_id = ${userId}`;
    throw new PublicError("Der Tisch ist voll.");
  }
  await bump(game.id);
}

export async function joinByCode(userId: string, code: string) {
  await ready();
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(clean)) throw new PublicError("Der Tischcode hat 6 Zeichen.");
  const rows = await db()`SELECT id FROM games WHERE code = ${clean}`;
  const id = (rows[0] as { id: string } | undefined)?.id;
  if (!id) throw new PublicError("Diesen Tisch gibt es nicht.", 404);
  const game = await gameById(id);
  if (!game) throw new PublicError("Diesen Tisch gibt es nicht.", 404);
  const seats = await seatsOf(game.id);
  if (seats.some((seat) => seat.user_id === userId)) return { id: game.id };
  if (game.status !== "lobby") throw new PublicError("Der Tisch ist nicht mehr offen.");
  await addPlayer(game, userId);
  return { id: game.id };
}

export async function loadTable(userId: string, gameId: string): Promise<TablePayload> {
  await ready();
  const found = await gameById(gameId);
  if (!found) throw new PublicError("Diesen Tisch gibt es nicht.", 404);
  const game = await withTick(found);
  const seats = await seatsOf(game.id);
  if (!seats.some((seat) => seat.user_id === userId)) throw new PublicError("Der Beitritt geht über den Code.", 403);
  return present(game, seats, userId);
}

export async function act(userId: string, gameId: string, version: number, command: Command) {
  await ready();
  const game = await gameById(gameId);
  if (!game) throw new PublicError("Diesen Tisch gibt es nicht.", 404);
  const seats = await seatsOf(game.id);
  if (!seats.some((seat) => seat.user_id === userId)) throw new PublicError("Du sitzt nicht an diesem Tisch.", 403);
  const info = gameInfo(game.type)!;

  if (command.type === "ready") {
    if (game.status !== "lobby") throw new PublicError("Die Runde läuft schon.");
    await db()`UPDATE game_players SET ready = ${command.ready} WHERE game_id = ${game.id} AND user_id = ${userId}`;
    await bump(game.id);
    return loadTable(userId, game.id);
  }

  if (command.type === "options") {
    if (game.host_id !== userId || game.status !== "lobby") throw new PublicError("Nur die gastgebende Person stellt das um.");
    const nextOptions = {
      tempo: game.options.tempo === "voll" ? "voll" : "kurz",
      city: chosenCity(game.options.city),
    };
    if (command.tempo) nextOptions.tempo = command.tempo;
    if (command.city) nextOptions.city = command.city;
    await db()`UPDATE games SET options = ${JSON.stringify(nextOptions)}::jsonb, version = version + 1, updated_at = now() WHERE id = ${game.id}`;
    return loadTable(userId, game.id);
  }

  if (command.type === "invite") {
    throw new PublicError("Dazu setzen geht mit dem Tischcode.");
  }

  if (command.type === "kick") {
    if (game.host_id !== userId || game.status !== "lobby") throw new PublicError("Nur die gastgebende Person schickt jemanden weg.");
    if (command.userId === userId) throw new PublicError("Dich selbst schickst du nicht weg.");
    await db()`DELETE FROM game_players WHERE game_id = ${game.id} AND user_id = ${command.userId}`;
    await bump(game.id);
    return loadTable(userId, game.id);
  }

  if (command.type === "leave") {
    if (game.status === "playing") {
      if (game.version !== version) throw new PublicError("Jemand war schneller. Nochmal.", 409);
      const next = forfeit(game.state as GameState, userId);
      const saved = await commit(game.id, version, "finished", next, game.options);
      if (!saved) throw new PublicError("Jemand war schneller. Nochmal.", 409);
      return { gone: true as const };
    }
    await db()`DELETE FROM game_players WHERE game_id = ${game.id} AND user_id = ${userId}`;
    const rest = await seatsOf(game.id);
    if (rest.length === 0) {
      await db()`DELETE FROM games WHERE id = ${game.id}`;
      return { gone: true as const };
    }
    if (game.host_id === userId) {
      const nextHost = rest[0]!;
      await db()`UPDATE games SET host_id = ${nextHost.user_id}, version = version + 1, updated_at = now() WHERE id = ${game.id}`;
      await db()`UPDATE game_players SET ready = true WHERE game_id = ${game.id} AND user_id = ${nextHost.user_id}`;
    } else {
      await bump(game.id);
    }
    return { gone: true as const };
  }

  if (command.type === "start") {
    if (game.host_id !== userId) throw new PublicError("Nur die gastgebende Person startet.");
    if (game.status !== "lobby") throw new PublicError("Die Runde läuft schon.");
    const fresh = await seatsOf(game.id);
    if (fresh.length < info.min) throw new PublicError(`Dafür brauchen wir ${info.min} Leute.`);
    if (fresh.length > info.max) throw new PublicError("Es sitzen zu viele Leute.");
    if (fresh.some((seat) => !seat.ready)) throw new PublicError("Es haben noch nicht alle zugesagt.");
    const tempo: Tempo = game.options.tempo === "voll" ? "voll" : "kurz";
    const city = chosenCity(game.options.city);
    const state = createMatch(
      game.type,
      fresh.map((seat) => ({ id: seat.user_id, name: seat.name })),
      tempo,
      Math.random,
      city,
    );
    const saved = await commit(game.id, game.version, "playing", state, { tempo, city });
    if (!saved) throw new PublicError("Jemand war schneller. Nochmal.", 409);
    return loadTable(userId, game.id);
  }

  if (game.status !== "playing") throw new PublicError("Die Runde läuft noch nicht.");
  if (game.version !== version) throw new PublicError("Jemand war schneller. Nochmal.", 409);
  const state = structuredClone(game.state) as GameState;
  paintNames(state, seats);
  if (tickMatch(state)) {
    const status = state.phase === "done" ? "finished" : "playing";
    const saved = await commit(game.id, version, status, state, game.options);
    if (!saved) throw new PublicError("Jemand war schneller. Nochmal.", 409);
    throw new PublicError("Die Zeit ist um.");
  }
  assertAction(state, command);
  const next = applyMatch(state, userId, command);
  const status = next.phase === "done" ? "finished" : "playing";
  const saved = await commit(game.id, version, status, next, game.options);
  if (!saved) throw new PublicError("Jemand war schneller. Nochmal.", 409);
  return loadTable(userId, game.id);
}
