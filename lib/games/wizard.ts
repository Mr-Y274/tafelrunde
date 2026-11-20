import { randomUUID } from "node:crypto";
import { PublicError } from "../errors";
import type { Action, Blatt, Player, Suit, Tempo, WCard, WizardState, WizardView } from "./types";
import { pushLog, shuffle } from "./util";

const COLOR: Suit[] = ["rot", "gelb", "gruen", "blau"];
const SKAT: Suit[] = ["kreuz", "pik", "herz", "karo"];
const SKAT_RANKS = [7, 8, 9, 10, 11, 12, 13, 14];

export function wizardBlatt(value: unknown): Blatt {
  return value === "skat" ? "skat" : "farbe";
}

export function wizardSuits(blatt: Blatt): Suit[] {
  return blatt === "skat" ? SKAT : COLOR;
}

export function suitLabel(suit: Suit) {
  if (suit === "rot") return "Rot";
  if (suit === "gelb") return "Gelb";
  if (suit === "gruen") return "Grün";
  if (suit === "blau") return "Blau";
  if (suit === "kreuz") return "Kreuz";
  if (suit === "pik") return "Pik";
  if (suit === "herz") return "Herz";
  return "Karo";
}

export function rankLabel(rank: number, blatt: Blatt) {
  if (blatt !== "skat") return String(rank);
  if (rank === 11) return "B";
  if (rank === 12) return "D";
  if (rank === 13) return "K";
  if (rank === 14) return "A";
  return String(rank);
}

function deckCount(blatt: Blatt) {
  return blatt === "skat" ? 40 : 60;
}

function freshDeck(blatt: Blatt): WCard[] {
  const cards: WCard[] = [];
  const suits = wizardSuits(blatt);
  const ranks = blatt === "skat" ? SKAT_RANKS : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  for (const suit of suits) {
    for (const rank of ranks) cards.push({ id: randomUUID(), t: "n", suit, rank });
  }
  for (let i = 0; i < 4; i++) {
    cards.push({ id: randomUUID(), t: "W" });
    cards.push({ id: randomUUID(), t: "J" });
  }
  return cards;
}

function deal(state: WizardState, rng: () => number) {
  const count = state.players.length;
  const cards = shuffle(freshDeck(state.blatt === "skat" ? "skat" : "farbe"), rng);
  state.hands = {};
  for (const player of state.players) state.hands[player.id] = [];
  let cursor = 0;
  const start = (state.dealer + 1) % count;
  for (let c = 0; c < state.round; c++) {
    for (let step = 0; step < count; step++) {
      const id = state.players[(start + step) % count]!.id;
      state.hands[id]!.push(cards[cursor]!);
      cursor += 1;
    }
  }
  state.bids = state.players.map(() => null);
  state.won = state.players.map(() => 0);
  state.trick = [];
  state.trumpSuit = null;
  state.needsTrumpChoice = false;
  if (cursor < cards.length) {
    const trump = cards[cursor]!;
    cursor += 1;
    state.trumpCard = trump;
    if (trump.t === "n") {
      state.trumpSuit = trump.suit;
      state.phase = "bid";
    } else if (trump.t === "W") {
      state.needsTrumpChoice = true;
      state.phase = "trump";
      state.turn = state.dealer;
      state.deck = cards.slice(cursor);
      state.banner = `${state.players[state.dealer]!.name} wählt den Trumpf.`;
      return;
    } else {
      state.phase = "bid";
    }
  } else {
    state.trumpCard = null;
    state.phase = "bid";
  }
  state.deck = cards.slice(cursor);
  state.turn = (state.dealer + 1) % count;
  const trumpText = state.trumpSuit ? `Trumpf ${suitLabel(state.trumpSuit)}.` : "Kein Trumpf.";
  state.banner = `Runde ${state.round}. ${trumpText} ${state.players[state.turn]!.name} sagt an.`;
}

export function createWizard(players: Player[], tempo: Tempo, rng: () => number = Math.random, blatt: Blatt = "farbe"): WizardState {
  if (players.length < 2 || players.length > 6) throw new PublicError("Wizard braucht 2 bis 6 Leute.");
  const chosen = wizardBlatt(blatt);
  const cards = deckCount(chosen);
  const state: WizardState = {
    kind: "wizard",
    blatt: chosen,
    players,
    dealer: 0,
    round: 1,
    maxRounds: tempo === "kurz" ? Math.min(6, Math.floor(cards / players.length)) : Math.floor(cards / players.length),
    phase: "bid",
    hands: {},
    trumpCard: null,
    trumpSuit: null,
    needsTrumpChoice: false,
    bids: [],
    won: [],
    turn: 0,
    trick: [],
    scores: players.map(() => 0),
    banner: "",
    log: [],
    deck: [],
    lastRound: null,
  };
  deal(state, rng);
  return state;
}

function leadSuit(trick: { card: WCard }[]): Suit | null {
  for (const item of trick) if (item.card.t === "n") return item.card.suit;
  return null;
}

export function wizardCanPlay(hand: WCard[], card: WCard, trick: { card: WCard }[]) {
  const lead = leadSuit(trick);
  if (!lead) return true;
  if (card.t !== "n") return true;
  if (card.suit === lead) return true;
  return !hand.some((item) => item.t === "n" && item.suit === lead);
}

export function wizardTrickWinner(trick: { player: number; card: WCard }[], trump: Suit | null) {
  const wizard = trick.find((item) => item.card.t === "W");
  if (wizard) return wizard.player;
  const lead = leadSuit(trick);
  const colored = trick.filter((item): item is { player: number; card: Extract<WCard, { t: "n" }> } => item.card.t === "n");
  if (colored.length === 0) return trick[0]!.player;
  const trumps = trump ? colored.filter((item) => item.card.suit === trump) : [];
  const pool = trumps.length > 0 ? trumps : colored.filter((item) => item.card.suit === lead);
  return pool.reduce((best, item) => (item.card.rank > best.card.rank ? item : best)).player;
}

function finishRound(state: WizardState) {
  const delta = state.players.map((_, index) => {
    const bid = state.bids[index] ?? 0;
    const got = state.won[index] ?? 0;
    return got === bid ? 20 + 10 * bid : -10 * Math.abs(got - bid);
  });
  delta.forEach((points, index) => {
    state.scores[index] = (state.scores[index] ?? 0) + points;
  });
  state.lastRound = {
    bids: state.bids.map((bid) => bid ?? 0),
    won: state.won.slice(),
    delta,
  };
  const summary = state.players
    .map((player, index) => `${player.name} ${delta[index]! >= 0 ? "+" : ""}${delta[index]}`)
    .join(", ");
  pushLog(state.log, `Runde ${state.round}: ${summary}`);
  if (state.round >= state.maxRounds) {
    const best = Math.max(...state.scores);
    state.phase = "done";
    state.winnerIds = state.players.filter((_, index) => state.scores[index] === best).map((player) => player.id);
    const names = state.players.filter((_, index) => state.scores[index] === best).map((player) => player.name);
    state.banner = `${names.join(" und ")} gewinnt mit ${best} Punkten.`;
    pushLog(state.log, state.banner);
    return;
  }
  state.round += 1;
  state.dealer = (state.dealer + 1) % state.players.length;
  deal(state, Math.random);
  state.banner = `${summary}. ${state.banner}`;
}

function me(state: WizardState, userId: string) {
  const index = state.players.findIndex((player) => player.id === userId);
  if (index < 0) throw new PublicError("Du sitzt nicht an diesem Tisch.");
  return index;
}

export function applyWizard(state: WizardState, userId: string, action: Action): WizardState {
  if (state.phase === "done") throw new PublicError("Die Partie ist vorbei.");
  const index = me(state, userId);

  if (action.type === "trump") {
    if (state.phase !== "trump") throw new PublicError("Gerade wählt niemand eine Farbe.");
    if (index !== state.dealer) throw new PublicError("Der Geber wählt den Trumpf.");
    if (!wizardSuits(state.blatt === "skat" ? "skat" : "farbe").includes(action.suit)) throw new PublicError("Diese Farbe gibt es nicht.");
    state.trumpSuit = action.suit;
    state.needsTrumpChoice = false;
    state.phase = "bid";
    state.turn = (state.dealer + 1) % state.players.length;
    state.banner = `Trumpf ist ${suitLabel(action.suit)}. ${state.players[state.turn]!.name} sagt an.`;
    return state;
  }

  if (action.type === "bid") {
    if (state.phase !== "bid") throw new PublicError("Gerade wird nicht angesagt.");
    if (index !== state.turn) throw new PublicError("Du bist nicht dran.");
    if (action.n < 0 || action.n > state.round) throw new PublicError("Die Ansage passt nicht zur Runde.");
    state.bids[index] = action.n;
    pushLog(state.log, `${state.players[index]!.name} sagt ${action.n} an.`);
    if (state.bids.every((bid) => bid !== null)) {
      state.phase = "play";
      state.turn = (state.dealer + 1) % state.players.length;
      state.trick = [];
      state.banner = `${state.players[state.turn]!.name} spielt aus.`;
    } else {
      state.turn = (index + 1) % state.players.length;
      state.banner = `${state.players[state.turn]!.name} sagt an.`;
    }
    return state;
  }

  if (action.type === "card") {
    if (state.phase !== "play") throw new PublicError("Gerade wird nicht gelegt.");
    if (index !== state.turn) throw new PublicError("Du bist nicht dran.");
    const hand = state.hands[userId] ?? [];
    const cardAt = hand.findIndex((card) => card.id === action.id);
    if (cardAt < 0) throw new PublicError("Die Karte liegt nicht auf deiner Hand.");
    const card = hand[cardAt]!;
    if (!wizardCanPlay(hand, card, state.trick)) throw new PublicError("Du musst die angespielte Farbe bedienen.");
    hand.splice(cardAt, 1);
    state.trick.push({ player: index, card });
    if (state.trick.length < state.players.length) {
      state.turn = (index + 1) % state.players.length;
      state.banner = `${state.players[state.turn]!.name} ist dran.`;
      return state;
    }
    const winner = wizardTrickWinner(state.trick, state.trumpSuit);
    state.won[winner] = (state.won[winner] ?? 0) + 1;
    pushLog(state.log, `${state.players[winner]!.name} macht den Stich.`);
    state.trick = [];
    state.turn = winner;
    if ((state.hands[userId] ?? []).length === 0) finishRound(state);
    else state.banner = `${state.players[winner]!.name} spielt aus.`;
    return state;
  }

  throw new PublicError("Das geht in Wizard gerade nicht.");
}

export function viewWizard(state: WizardState, userId: string): WizardView {
  const index = state.players.findIndex((player) => player.id === userId);
  const hand = state.hands[userId] ?? [];
  const youAreUp = state.phase !== "done" && index === state.turn;
  const legalIds =
    youAreUp && state.phase === "play" ? hand.filter((card) => wizardCanPlay(hand, card, state.trick)).map((card) => card.id) : [];
  return {
    kind: "wizard",
    blatt: state.blatt === "skat" ? "skat" : "farbe",
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    trumpCard: state.trumpCard,
    trumpSuit: state.trumpSuit,
    needsTrumpChoice: state.needsTrumpChoice,
    dealerId: state.players[state.dealer]!.id,
    turnId: state.players[state.turn]!.id,
    youAreUp,
    hand,
    legalIds,
    trick: state.trick.map((item) => ({ name: state.players[item.player]!.name, card: item.card })),
    rows: state.players.map((player, playerIndex) => ({
      id: player.id,
      name: player.name,
      bid: state.bids[playerIndex] ?? null,
      won: state.won[playerIndex] ?? 0,
      score: state.scores[playerIndex] ?? 0,
    })),
    banner: state.banner,
    log: state.log,
    winnerIds: state.winnerIds,
    cardsThisRound: state.round,
    yourBid: index >= 0 ? (state.bids[index] ?? null) : null,
    lastRound: state.lastRound,
  };
}
