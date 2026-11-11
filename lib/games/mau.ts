import { PublicError } from "../errors";
import type { LoveAnimal } from "./love";
import type { Action, MauCard, MauRank, MauState, MauView, Player, Tempo } from "./types";
import { pushLog, shuffle } from "./util";

const RANKS: MauRank[] = ["7", "8", "9", "10", "B", "D", "K", "A"];
const ANIMALS: LoveAnimal[] = ["hase", "baer", "fuchs", "eule"];

function deckOf(): MauCard[] {
  const cards: MauCard[] = [];
  let n = 0;
  for (const animal of ANIMALS) for (const rank of RANKS) cards.push({ id: `m${n++}`, animal, rank });
  return cards;
}

function handSize(players: number, tempo: Tempo) {
  const want = tempo === "voll" ? 7 : 5;
  return Math.max(3, Math.min(want, Math.floor(31 / players)));
}

function pull(state: MauState) {
  if (state.deck.length === 0) {
    if (state.burned.length === 0) throw new PublicError("Keine Karten mehr.");
    state.deck = shuffle(state.burned.splice(0), Math.random);
  }
  return state.deck.pop()!;
}

function step(state: MauState, count: number) {
  const size = state.players.length;
  state.turn = (state.turn + state.dir * count + size * 8) % size;
}

function winner(state: MauState, index: number) {
  const player = state.players[index]!;
  state.phase = "done";
  state.winnerIds = [player.id];
  state.banner = `${player.name} hat das letzte Herz gelegt.`;
  pushLog(state.log, state.banner);
}

export function mauFits(card: MauCard, top: MauCard, animal: LoveAnimal, pending: number) {
  if (pending > 0) return card.rank === "7";
  if (card.rank === "B") return true;
  return card.animal === animal || card.rank === top.rank;
}

export function createMau(players: Player[], tempo: Tempo, rng: () => number = Math.random): MauState {
  const pile = shuffle(deckOf(), rng);
  const size = handSize(players.length, tempo);
  const hands: Record<string, MauCard[]> = {};
  for (const player of players) hands[player.id] = pile.splice(0, size);
  const top = pile.pop()!;
  const state: MauState = {
    kind: "mau",
    players,
    hands,
    deck: pile,
    burned: [],
    top,
    animal: top.animal,
    dir: 1,
    turn: 0,
    pending: top.rank === "7" ? 2 : 0,
    phase: "play",
    drawnId: null,
    banner: "",
    log: [],
  };
  if (top.rank === "8") step(state, 1);
  if (top.rank === "A" && players.length > 2) {
    state.dir = -1;
    state.turn = players.length - 1;
  }
  state.banner = `${state.players[state.turn]!.name} ist dran.`;
  pushLog(state.log, "Die Tiere liegen aus.");
  return state;
}

function actor(state: MauState, userId: string) {
  if (state.phase === "done") throw new PublicError("Die Runde ist vorbei.");
  const index = state.players.findIndex((player) => player.id === userId);
  if (index < 0) throw new PublicError("Du sitzt nicht an diesem Tisch.");
  if (index !== state.turn) throw new PublicError("Du bist nicht dran.");
  return index;
}

function afterPlay(state: MauState, index: number, card: MauCard, chosen: LoveAnimal | undefined, stacked: number) {
  state.burned.push(state.top);
  state.top = card;
  state.animal = card.rank === "B" ? (chosen ?? card.animal) : card.animal;
  const hand = state.hands[state.players[index]!.id] ?? [];
  if (hand.length === 0) {
    winner(state, index);
    return;
  }
  if (card.rank === "7") {
    state.pending = stacked + 2;
    step(state, 1);
  } else if (card.rank === "8") step(state, 2);
  else if (card.rank === "A") {
    if (state.players.length === 2) step(state, 2);
    else {
      state.dir = state.dir === 1 ? -1 : 1;
      step(state, 1);
    }
  } else step(state, 1);
  state.phase = "play";
  state.drawnId = null;
  state.banner = `${state.players[state.turn]!.name} ist dran.`;
  pushLog(state.log, `${state.players[index]!.name} legt ${card.rank === "B" ? "einen Buben" : card.rank}.`);
}

export function applyMau(state: MauState, userId: string, action: Action): MauState {
  const index = actor(state, userId);
  const id = state.players[index]!.id;
  const hand = state.hands[id] ?? [];

  if (action.type === "mau-draw") {
    if (state.phase !== "play") throw new PublicError("Du hast schon gezogen.");
    const amount = Math.max(1, state.pending);
    if (state.pending === 0 && hand.some((card) => mauFits(card, state.top, state.animal, 0))) {
      throw new PublicError("Du hast eine Karte, die passt.");
    }
    const drawn: MauCard[] = [];
    for (let n = 0; n < amount; n++) drawn.push(pull(state));
    hand.push(...drawn);
    state.hands[id] = hand;
    state.pending = 0;
    if (amount === 1 && mauFits(drawn[0]!, state.top, state.animal, 0)) {
      state.phase = "drawn";
      state.drawnId = drawn[0]!.id;
      state.banner = "Die Karte passt. Du darfst sie legen oder behalten.";
      return state;
    }
    step(state, 1);
    state.banner = `${state.players[state.turn]!.name} ist dran.`;
    return state;
  }

  if (action.type === "mau-keep") {
    if (state.phase !== "drawn") throw new PublicError("Es gibt nichts zu behalten.");
    state.phase = "play";
    state.drawnId = null;
    step(state, 1);
    state.banner = `${state.players[state.turn]!.name} ist dran.`;
    return state;
  }

  if (action.type === "mau-play") {
    const card = hand.find((item) => item.id === action.id);
    if (!card) throw new PublicError("Die Karte ist nicht auf deiner Hand.");
    if (state.phase === "drawn" && card.id !== state.drawnId) throw new PublicError("Du darfst nur die gezogene Karte legen.");
    if (!mauFits(card, state.top, state.animal, state.pending)) throw new PublicError("Die Karte passt nicht.");
    if (card.rank === "B" && state.pending === 0 && !action.animal) throw new PublicError("Der Bube sucht ein Tier aus.");
  state.hands[id] = hand.filter((item) => item.id !== card.id);
  const stacked = state.pending;
  state.pending = 0;
  afterPlay(state, index, card, action.animal, stacked);
    return state;
  }

  throw new PublicError("Das gehört nicht zu diesem Spiel.");
}

export function viewMau(state: MauState, userId: string): MauView {
  const index = state.players.findIndex((player) => player.id === userId);
  const hand = state.hands[userId] ?? [];
  const yours = index === state.turn && state.phase !== "done";
  const legal = !yours
    ? []
    : state.phase === "drawn"
      ? hand.filter((card) => card.id === state.drawnId).map((card) => card.id)
      : hand.filter((card) => mauFits(card, state.top, state.animal, state.pending)).map((card) => card.id);
  return {
    kind: "mau",
    phase: state.phase,
    youAreUp: yours,
    turnId: state.players[state.turn]?.id ?? "",
    animal: state.animal,
    top: state.top,
    hand,
    legalIds: legal,
    pending: state.pending,
    dir: state.dir,
    deck: state.deck.length,
    rows: state.players.map((player) => ({ id: player.id, name: player.name, cards: state.hands[player.id]?.length ?? 0 })),
    banner: state.banner,
    log: state.log,
    winnerIds: state.winnerIds,
  };
}

export function mauCardCount(state: MauState) {
  const hands = Object.values(state.hands).reduce((sum, hand) => sum + hand.length, 0);
  return hands + state.deck.length + state.burned.length + 1;
}
