import { PublicError } from "../errors";
import type { Action, Player, VierState, VierView } from "./types";
import { pushLog } from "./util";

export type VierFeld = "klein" | "mittel" | "gross";

const MARKS = ["💗", "💛", "💚", "💙"];

export function vierFeld(value: unknown): VierFeld {
  return value === "klein" || value === "gross" ? value : "mittel";
}

export function vierSize(feld: VierFeld) {
  if (feld === "klein") return { cols: 6, rows: 5 };
  if (feld === "gross") return { cols: 9, rows: 7 };
  return { cols: 7, rows: 6 };
}

function boardOf(state: VierState) {
  return { cols: state.cols || 7, rows: state.rows || 6 };
}

function lineFrom(cells: (number | null)[], last: number, cols: number, rows: number) {
  const col = last % cols;
  const row = Math.floor(last / cols);
  const player = cells[last];
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];
  for (const [dc, dr] of dirs) {
    const found = [last];
    for (const sign of [-1, 1]) {
      let c = col + dc! * sign;
      let r = row + dr! * sign;
      while (c >= 0 && c < cols && r >= 0 && r < rows && cells[r * cols + c] === player) {
        found.push(r * cols + c);
        c += dc! * sign;
        r += dr! * sign;
      }
    }
    if (found.length >= 4) return found;
  }
  return null;
}

export function createVier(players: Player[], feld: VierFeld = "mittel"): VierState {
  const { cols, rows } = vierSize(feld);
  const state: VierState = {
    kind: "vier",
    players,
    cells: Array.from({ length: cols * rows }, () => null),
    cols,
    rows,
    last: null,
    turn: 0,
    phase: "play",
    win: [],
    banner: `${players[0]?.name ?? "Jemand"} lässt ein Herz fallen.`,
    log: [],
  };
  pushLog(state.log, `${cols} Spalten, ${rows} Reihen.`);
  return state;
}

export function applyVier(state: VierState, userId: string, action: Action): VierState {
  if (state.phase === "done") throw new PublicError("Die Runde ist vorbei.");
  const index = state.players.findIndex((player) => player.id === userId);
  if (index < 0) throw new PublicError("Du sitzt nicht an diesem Tisch.");
  if (index !== state.turn) throw new PublicError("Du bist nicht dran.");
  if (action.type !== "vier-drop") throw new PublicError("Das gehört nicht zu diesem Spiel.");
  const { cols, rows } = boardOf(state);
  const col = action.col;
  if (col < 0 || col >= cols) throw new PublicError("Die Spalte gibt es nicht.");
  let spot = -1;
  for (let row = 0; row < rows; row++) {
    if (state.cells[row * cols + col] == null) {
      spot = row * cols + col;
      break;
    }
  }
  if (spot < 0) throw new PublicError("Die Spalte ist voll.");
  state.cells[spot] = index;
  state.last = spot;
  const win = lineFrom(state.cells, spot, cols, rows);
  const player = state.players[index]!;
  if (win) {
    state.win = win;
    state.phase = "done";
    state.winnerIds = [player.id];
    state.banner = `${player.name} hat vier Herzen.`;
    pushLog(state.log, state.banner);
    return state;
  }
  if (state.cells.every((cell) => cell != null)) {
    state.phase = "done";
    state.winnerIds = state.players.map((item) => item.id);
    state.banner = "Unentschieden. Die Herzen sind voll.";
    pushLog(state.log, state.banner);
    return state;
  }
  state.turn = (index + 1) % state.players.length;
  state.banner = `${state.players[state.turn]!.name} lässt ein Herz fallen.`;
  return state;
}

export function viewVier(state: VierState, userId: string): VierView {
  const index = state.players.findIndex((player) => player.id === userId);
  const { cols, rows } = boardOf(state);
  return {
    kind: "vier",
    phase: state.phase,
    youAreUp: index === state.turn && state.phase !== "done",
    turnId: state.players[state.turn]?.id ?? "",
    you: index,
    cells: state.cells,
    cols,
    height: rows,
    last: state.last ?? null,
    win: state.win,
    rows: state.players.map((player, seat) => ({ id: player.id, name: player.name, mark: MARKS[seat] ?? "💗" })),
    banner: state.banner,
    log: state.log,
    winnerIds: state.winnerIds,
  };
}
