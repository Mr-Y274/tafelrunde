import { PublicError } from "../errors";
import { fleetMeta } from "./fleet";
import type { Action, Player, SchiffeState, SchiffeView, Ship, ShipId, Shot, Tempo } from "./types";
import { pushLog } from "./util";

function cellsFor(id: ShipId, x: number, y: number, dir: "h" | "v"): [number, number][] {
  const { len, name } = fleetMeta(id);
  const cells: [number, number][] = [];
  for (let step = 0; step < len; step++) {
    const cx = x + (dir === "h" ? step : 0);
    const cy = y + (dir === "v" ? step : 0);
    if (cx > 9 || cy > 9) throw new PublicError(`${name} ragt aus dem Feld.`);
    cells.push([cx, cy]);
  }
  return cells;
}

function sunkSet(ships: Ship[], shots: Shot[]) {
  const hits = new Set(shots.filter((shot) => shot.hit).map((shot) => `${shot.x},${shot.y}`));
  return new Set(ships.filter((ship) => ship.cells.every(([x, y]) => hits.has(`${x},${y}`))).map((ship) => ship.id));
}

export function createSchiffe(players: Player[], _tempo: Tempo, rng: () => number = Math.random): SchiffeState {
  if (players.length !== 2) throw new PublicError("Schiffe versenken braucht genau zwei Leute.");
  return {
    kind: "schiffe",
    players,
    phase: "placement",
    starterIndex: Math.floor(rng() * 2),
    turn: null,
    ready: { [players[0]!.id]: false, [players[1]!.id]: false },
    ships: { [players[0]!.id]: [], [players[1]!.id]: [] },
    shots: { [players[0]!.id]: [], [players[1]!.id]: [] },
    banner: "Beide setzen ihre Flotte.",
    log: [],
  };
}

export function applySchiffe(state: SchiffeState, userId: string, action: Action): SchiffeState {
  if (state.phase === "done") throw new PublicError("Die Partie ist vorbei.");
  const me = state.players.find((player) => player.id === userId);
  if (!me) throw new PublicError("Du sitzt nicht an diesem Tisch.");
  const foe = state.players.find((player) => player.id !== userId)!;

  if (action.type === "place") {
    if (state.phase !== "placement") throw new PublicError("Die Flotten sind schon gesetzt.");
    if (state.ready[userId]) throw new PublicError("Du hast deine Schiffe schon gelegt.");
    if (action.ships.length !== 5) throw new PublicError("Es müssen alle fünf Schiffe sein.");
    const seen = new Set<string>();
    const occupied = new Set<string>();
    const ships: Ship[] = [];
    for (const spec of action.ships) {
      if (seen.has(spec.id)) throw new PublicError("Jedes Schiff nur einmal.");
      seen.add(spec.id);
      const cells = cellsFor(spec.id, spec.x, spec.y, spec.dir);
      for (const [x, y] of cells) {
        const key = `${x},${y}`;
        if (occupied.has(key)) throw new PublicError("Zwei Schiffe liegen übereinander.");
        occupied.add(key);
      }
      ships.push({ id: spec.id, cells });
    }
    if (seen.size !== 5) throw new PublicError("Es fehlt ein Schiff.");
    state.ships[userId] = ships;
    state.ready[userId] = true;
    if (state.players.every((player) => state.ready[player.id])) {
      state.phase = "battle";
      state.turn = state.players[state.starterIndex]!.id;
      state.banner = `${state.players[state.starterIndex]!.name} schießt zuerst.`;
      pushLog(state.log, "Beide Flotten liegen. Es wird geschossen.");
    } else {
      state.banner = `${me.name} ist fertig. ${foe.name} setzt noch.`;
    }
    return state;
  }

  if (action.type === "shoot") {
    if (state.phase !== "battle") throw new PublicError("Noch liegen nicht beide Flotten.");
    if (state.turn !== userId) throw new PublicError("Du bist nicht dran.");
    if (action.x < 0 || action.y < 0 || action.x > 9 || action.y > 9) throw new PublicError("Das Feld liegt außerhalb.");
    const ownShots = state.shots[userId] ?? [];
    if (ownShots.some((shot) => shot.x === action.x && shot.y === action.y)) {
      throw new PublicError("Dahin hast du schon geschossen.");
    }
    const target = state.ships[foe.id] ?? [];
    const hitShip = target.find((ship) => ship.cells.some(([x, y]) => x === action.x && y === action.y));
    const shot: Shot = { x: action.x, y: action.y, hit: Boolean(hitShip) };
    ownShots.push(shot);
    state.shots[userId] = ownShots;
    if (hitShip) {
      const sunk = sunkSet(target, ownShots);
      if (sunk.has(hitShip.id)) {
        shot.sunk = hitShip.id;
        pushLog(state.log, `${me.name} versenkt ${fleetMeta(hitShip.id).name}.`);
      } else {
        pushLog(state.log, `${me.name} trifft.`);
      }
      if (target.every((ship) => sunk.has(ship.id))) {
        state.phase = "done";
        state.winnerIds = [userId];
        state.turn = null;
        state.banner = `${me.name} hat die Flotte versenkt.`;
        pushLog(state.log, state.banner);
        return state;
      }
    } else {
      pushLog(state.log, `${me.name} schießt ins Wasser.`);
    }
    state.turn = foe.id;
    state.banner = `${foe.name} ist dran.`;
    return state;
  }

  throw new PublicError("Das geht bei Schiffe versenken gerade nicht.");
}

function marked(ships: Ship[], shotsAgainst: Shot[]) {
  const sunk = sunkSet(ships, shotsAgainst);
  return ships.map((ship) => ({ id: ship.id, cells: ship.cells, sunk: sunk.has(ship.id) }));
}

export function viewSchiffe(state: SchiffeState, userId: string): SchiffeView {
  const foe = state.players.find((player) => player.id !== userId) ?? state.players[0]!;
  const yours = state.ships[userId] ?? [];
  const incoming = state.shots[foe.id] ?? [];
  const outgoing = state.shots[userId] ?? [];
  const foeShips = state.ships[foe.id] ?? [];
  const sunkFoe = [...sunkSet(foeShips, outgoing)];
  const reveal = state.phase === "done";
  return {
    kind: "schiffe",
    phase: state.phase,
    youAreUp: state.phase === "placement" ? !state.ready[userId] : state.turn === userId,
    turnId: state.turn,
    youPlaced: Boolean(state.ready[userId]),
    foePlaced: Boolean(state.ready[foe.id]),
    foeId: foe.id,
    yourShips: marked(yours, incoming),
    incoming,
    outgoing,
    sunkFoe,
    foeShips: reveal
      ? marked(foeShips, outgoing)
      : marked(foeShips, outgoing).filter((ship) => ship.sunk),
    winnerIds: state.winnerIds,
    banner: state.banner,
    log: state.log,
  };
}
