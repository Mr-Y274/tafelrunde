import { PublicError } from "../errors";
import { applyMau, createMau, viewMau } from "./mau";
import { applyMemo, createMemo, viewMemo } from "./memo";
import { applyPictionary, createPictionary, tickPictionary, viewPictionary } from "./pictionary";
import { applySchiffe, createSchiffe, viewSchiffe } from "./schiffe";
import { applyScotland, createScotland, viewScotland } from "./scotland";
import { applyStapel, createStapel, viewStapel } from "./stapel";
import type { CityId } from "./city-maps";
import type { Action, GameId, GameState, GameView, Player, Tempo } from "./types";
import { applyUno, createUno, viewUno } from "./uno";
import { pushLog } from "./util";
import { applyVier, createVier, viewVier } from "./vier";
import { applyWizard, createWizard, viewWizard } from "./wizard";
import { applyZehn, createZehn, viewZehn } from "./zehn";

export function createMatch(type: GameId, players: Player[], tempo: Tempo, rng: () => number = Math.random, city: CityId = "london"): GameState {
  if (type === "wizard") return createWizard(players, tempo, rng);
  if (type === "schiffe") return createSchiffe(players, tempo, rng);
  if (type === "scotland") return createScotland(players, tempo, rng, city);
  if (type === "uno") return createUno(players, tempo);
  if (type === "zehn") return createZehn(players, tempo, rng);
  if (type === "stapel") return createStapel(players, tempo, rng);
  if (type === "memo") return createMemo(players, tempo, rng);
  if (type === "vier") return createVier(players);
  if (type === "mau") return createMau(players, tempo, rng);
  return createPictionary(players, tempo, rng);
}

export function applyMatch(state: GameState, userId: string, action: Action, now = Date.now()): GameState {
  const next = structuredClone(state);
  if (next.kind === "wizard") return applyWizard(next, userId, action);
  if (next.kind === "schiffe") return applySchiffe(next, userId, action);
  if (next.kind === "scotland") return applyScotland(next, userId, action);
  if (next.kind === "uno") return applyUno(next, userId, action);
  if (next.kind === "zehn") return applyZehn(next, userId, action);
  if (next.kind === "stapel") return applyStapel(next, userId, action);
  if (next.kind === "memo") return applyMemo(next, userId, action);
  if (next.kind === "vier") return applyVier(next, userId, action);
  if (next.kind === "mau") return applyMau(next, userId, action);
  return applyPictionary(next, userId, action, now);
}

export function viewMatch(state: GameState, userId: string): GameView {
  if (state.kind === "wizard") return viewWizard(state, userId);
  if (state.kind === "schiffe") return viewSchiffe(state, userId);
  if (state.kind === "scotland") return viewScotland(state, userId);
  if (state.kind === "uno") return viewUno(state, userId);
  if (state.kind === "zehn") return viewZehn(state, userId);
  if (state.kind === "stapel") return viewStapel(state, userId);
  if (state.kind === "memo") return viewMemo(state, userId);
  if (state.kind === "vier") return viewVier(state, userId);
  if (state.kind === "mau") return viewMau(state, userId);
  return viewPictionary(state, userId);
}

export function tickMatch(state: GameState, now = Date.now()) {
  if (state.kind !== "pictionary") return false;
  return tickPictionary(state, now);
}

export function forfeit(state: GameState, userId: string): GameState {
  const next = structuredClone(state);
  const name = next.players.find((player) => player.id === userId)?.name ?? "Jemand";
  next.winnerIds = next.players.filter((player) => player.id !== userId).map((player) => player.id);
  next.phase = "done";
  next.banner = `${name} hat aufgegeben.`;
  pushLog(next.log, next.banner);
  if (next.kind === "pictionary") next.word = "";
  if (next.kind === "schiffe") next.turn = null;
  return next;
}

export function assertAction(state: GameState, action: Action) {
  const kind = state.kind;
  const ok =
    (kind === "schiffe" && (action.type === "place" || action.type === "shoot")) ||
    (kind === "wizard" && (action.type === "bid" || action.type === "trump" || action.type === "card")) ||
    (kind === "uno" && action.type.startsWith("uno-")) ||
    (kind === "scotland" && action.type.startsWith("sy-")) ||
    (kind === "pictionary" && (action.type === "stroke" || action.type === "undo" || action.type === "clear" || action.type === "skip" || action.type === "guess")) ||
    (kind === "zehn" && action.type.startsWith("zehn-")) ||
    (kind === "stapel" && action.type.startsWith("stapel-")) ||
    (kind === "memo" && action.type.startsWith("memo-")) ||
    (kind === "vier" && action.type === "vier-drop") ||
    (kind === "mau" && action.type.startsWith("mau-"));
  if (!ok) throw new PublicError("Das gehört nicht zu diesem Spiel.");
}
