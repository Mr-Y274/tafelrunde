import { PublicError } from "../errors";
import { MEMO_FRIENDS } from "./love";
import type { Action, MemoState, MemoView, Player } from "./types";
import { pushLog, shuffle } from "./util";

export type MemoPairs = 6 | 10 | 15;

export function memoPairs(value: unknown): MemoPairs {
  return value === 6 || value === 10 || value === 15 ? value : 10;
}

export function createMemo(players: Player[], pairs: MemoPairs = 10, rng: () => number = Math.random): MemoState {
  const friends = MEMO_FRIENDS.slice(0, pairs);
  const tiles = shuffle(
    friends.flatMap(([animal, mark]) => [
      { animal, mark, up: false, owner: null },
      { animal, mark, up: false, owner: null },
    ]),
    rng,
  );
  const state: MemoState = {
    kind: "memo",
    players,
    tiles,
    cols: pairs === 15 ? 6 : pairs === 10 ? 5 : 4,
    open: [],
    turn: 0,
    scores: players.map(() => 0),
    phase: "flip",
    banner: `${players[0]?.name ?? "Jemand"} deckt auf.`,
    log: [],
  };
  pushLog(state.log, "Die Tierchen schlafen.");
  return state;
}

function actor(state: MemoState, userId: string) {
  if (state.phase === "done") throw new PublicError("Die Runde ist vorbei.");
  const index = state.players.findIndex((player) => player.id === userId);
  if (index < 0) throw new PublicError("Du sitzt nicht an diesem Tisch.");
  if (index !== state.turn) throw new PublicError("Du bist nicht dran.");
  return index;
}

export function applyMemo(state: MemoState, userId: string, action: Action): MemoState {
  const index = actor(state, userId);
  const player = state.players[index]!;

  if (action.type === "memo-hide") {
    if (state.phase !== "show") throw new PublicError("Es liegt nichts offen, das wieder schlafen soll.");
    for (const spot of state.open) {
      const tile = state.tiles[spot];
      if (tile) tile.up = false;
    }
    state.open = [];
    state.phase = "flip";
    state.turn = (index + 1) % state.players.length;
    state.banner = `${state.players[state.turn]!.name} deckt auf.`;
    return state;
  }

  if (action.type === "memo-flip") {
    if (state.phase !== "flip") throw new PublicError("Deck die offenen Karten zuerst zu.");
    const tile = state.tiles[action.index];
    if (!tile || tile.owner != null || tile.up) throw new PublicError("Die Karte schläft nicht.");
    tile.up = true;
    state.open.push(action.index);
    if (state.open.length < 2) {
      state.banner = `${player.name} sucht das zweite ${tile.animal}.`;
      return state;
    }
    const [a, b] = state.open;
    const first = state.tiles[a!]!;
    const second = state.tiles[b!]!;
    if (first.animal === second.animal) {
      first.owner = index;
      second.owner = index;
      state.scores[index] = (state.scores[index] ?? 0) + 1;
      state.open = [];
      state.banner = `${player.name} findet zwei ${first.animal}.`;
      pushLog(state.log, state.banner);
      if (state.tiles.every((item) => item.owner != null)) {
        const best = Math.max(...state.scores);
        state.phase = "done";
        state.winnerIds = state.players.filter((_, seat) => state.scores[seat] === best).map((item) => item.id);
        const names = state.players.filter((item) => state.winnerIds?.includes(item.id)).map((item) => item.name);
        state.banner = names.length > 1 ? `Gleichstand: ${names.join(" und ")}.` : `${names[0]} hat die meisten Tierchen.`;
        pushLog(state.log, state.banner);
      }
      return state;
    }
    state.phase = "show";
    state.banner = "Kein Paar. Alle dürfen hinsehen, dann wird zugedeckt.";
    return state;
  }

  throw new PublicError("Das gehört nicht zu diesem Spiel.");
}

export function viewMemo(state: MemoState, userId: string): MemoView {
  const index = state.players.findIndex((player) => player.id === userId);
  return {
    kind: "memo",
    phase: state.phase,
    youAreUp: index === state.turn && state.phase !== "done",
    turnId: state.players[state.turn]?.id ?? "",
    cols: state.cols,
    tiles: state.tiles.map((tile) => {
      const open = tile.up || tile.owner != null;
      return {
        hidden: !open,
        animal: open ? tile.animal : undefined,
        mark: open ? tile.mark : undefined,
        owner: tile.owner == null ? undefined : state.players[tile.owner]?.name,
      };
    }),
    scores: state.players.map((player, seat) => ({ id: player.id, name: player.name, score: state.scores[seat] ?? 0 })),
    banner: state.banner,
    log: state.log,
    winnerIds: state.winnerIds,
  };
}
