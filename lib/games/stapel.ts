import { PublicError } from "../errors";
import type { Action, Player, StapelCard, StapelState, StapelView, Tempo } from "./types";
import { pushLog, shuffle } from "./util";

function deckOf(): StapelCard[] {
  const cards: StapelCard[] = [];
  let n = 0;
  for (let value = 1; value <= 12; value++) {
    for (let copy = 0; copy < 12; copy++) cards.push({ id: `s${n++}`, n: value });
  }
  for (let i = 0; i < 18; i++) cards.push({ id: `s${n++}`, n: null, wild: true });
  return cards;
}

export function stapelStock(players: number, tempo: Tempo) {
  const full = players <= 2 ? 15 : players === 3 ? 12 : players === 4 ? 10 : 8;
  return tempo === "kurz" ? Math.max(5, Math.ceil(full / 2)) : full;
}

export function stapelNeed(top: number) {
  if (top >= 12) return null;
  return top <= 0 ? 1 : top + 1;
}

export function stapelFits(card: StapelCard, top: number) {
  const need = stapelNeed(top);
  if (need == null) return false;
  return card.n == null || card.n === need;
}

function topOf(cards: StapelCard[]) {
  return cards.at(-1) ?? null;
}

function pull(state: StapelState) {
  if (state.deck.length === 0 && state.box.length > 0) state.deck = shuffle(state.box.splice(0), Math.random);
  return state.deck.pop() ?? null;
}

function fill(state: StapelState, id: string) {
  const hand = state.hands[id] ?? [];
  while (hand.length < 5) {
    const card = pull(state);
    if (!card) break;
    hand.push(card);
  }
  state.hands[id] = hand;
}

export function createStapel(players: Player[], tempo: Tempo, rng: () => number = Math.random): StapelState {
  const pile = shuffle(deckOf(), rng);
  const size = stapelStock(players.length, tempo);
  const state: StapelState = {
    kind: "stapel",
    players,
    stock: {},
    hands: {},
    bins: {},
    piles: [[], [], [], []],
    box: [],
    deck: [],
    turn: 0,
    phase: "play",
    banner: `${players[0]?.name ?? "Jemand"} baut.`,
    log: [],
  };
  for (const player of players) {
    state.stock[player.id] = pile.splice(0, size);
    state.hands[player.id] = [];
    state.bins[player.id] = [[], [], [], []];
  }
  state.deck = pile;
  const first = players[0]!;
  fill(state, first.id);
  pushLog(state.log, "Die Liebesstapel sind gelegt.");
  return state;
}

function actor(state: StapelState, userId: string) {
  if (state.phase === "done") throw new PublicError("Die Runde ist vorbei.");
  const index = state.players.findIndex((player) => player.id === userId);
  if (index < 0) throw new PublicError("Du sitzt nicht an diesem Tisch.");
  if (index !== state.turn) throw new PublicError("Du bist nicht dran.");
  return state.players[index]!;
}

function pileTop(pile: StapelCard[]) {
  return pile.at(-1)?.n ?? 0;
}

function playOnto(state: StapelState, pileIndex: number, card: StapelCard) {
  const pile = state.piles[pileIndex];
  if (!pile) throw new PublicError("Den Baustapel gibt es nicht.");
  const need = stapelNeed(pileTop(pile));
  if (need == null || (card.n != null && card.n !== need)) throw new PublicError("Da passt nur die nächste Zahl.");
  const placed = card.n == null ? { ...card, n: need, wild: true } : card;
  pile.push(placed);
  if (placed.n === 12) {
    state.box.push(...pile.splice(0));
  }
}

function finish(state: StapelState, playerId: string) {
  const player = state.players.find((item) => item.id === playerId)!;
  state.phase = "done";
  state.winnerIds = [playerId];
  state.banner = `${player.name} hat den Liebesstapel leer gespielt.`;
  pushLog(state.log, state.banner);
}

function nextTurn(state: StapelState) {
  state.turn = (state.turn + 1) % state.players.length;
  const player = state.players[state.turn]!;
  fill(state, player.id);
  state.banner = `${player.name} baut.`;
}

export function applyStapel(state: StapelState, userId: string, action: Action): StapelState {
  const player = actor(state, userId);
  const hand = state.hands[player.id] ?? [];
  const stock = state.stock[player.id] ?? [];
  const bins = state.bins[player.id] ?? [[], [], [], []];

  if (action.type === "stapel-play") {
    const pile = state.piles[action.pile];
    if (!pile) throw new PublicError("Den Baustapel gibt es nicht.");
    let card: StapelCard | undefined;
    if (action.from === "hand") {
      card = hand.find((item) => item.id === action.id);
      if (!card) throw new PublicError("Die Karte ist nicht auf deiner Hand.");
      if (!stapelFits(card, pileTop(pile))) throw new PublicError("Da passt nur die nächste Zahl.");
      state.hands[player.id] = hand.filter((item) => item.id !== card!.id);
    } else if (action.from === "stock") {
      card = stock.at(-1);
      if (!card) throw new PublicError("Dein Liebesstapel ist leer.");
      if (!stapelFits(card, pileTop(pile))) throw new PublicError("Da passt nur die nächste Zahl.");
      stock.pop();
    } else {
      const slot = bins[action.slot ?? -1];
      card = slot?.at(-1);
      if (!slot || !card) throw new PublicError("Auf der Ablage liegt nichts.");
      if (!stapelFits(card, pileTop(pile))) throw new PublicError("Da passt nur die nächste Zahl.");
      slot.pop();
    }
    const shown = card.n ?? stapelNeed(pileTop(pile));
    playOnto(state, action.pile, card);
    if (stock.length === 0) {
      finish(state, player.id);
      return state;
    }
    if ((state.hands[player.id] ?? []).length === 0) fill(state, player.id);
    state.banner = `${player.name} baut ${shown}.`;
    return state;
  }

  if (action.type === "stapel-end") {
    const slot = bins[action.slot];
    if (!slot) throw new PublicError("Die Ablage gibt es nicht.");
    if (!action.id) {
      if (hand.length > 0) throw new PublicError("Leg noch eine Karte ab.");
      nextTurn(state);
      return state;
    }
    const card = hand.find((item) => item.id === action.id);
    if (!card) throw new PublicError("Die Karte ist nicht auf deiner Hand.");
    state.hands[player.id] = hand.filter((item) => item.id !== card.id);
    slot.push(card);
    pushLog(state.log, `${player.name} legt ab.`);
    nextTurn(state);
    return state;
  }

  throw new PublicError("Das gehört nicht zu diesem Spiel.");
}

function showBin(cards: StapelCard[]) {
  const top = topOf(cards);
  return { n: top?.n ?? null, wild: top?.wild, count: cards.length };
}

export function viewStapel(state: StapelState, userId: string): StapelView {
  const index = state.players.findIndex((player) => player.id === userId);
  const stock = state.stock[userId] ?? [];
  return {
    kind: "stapel",
    phase: state.phase,
    youAreUp: index === state.turn && state.phase !== "done",
    turnId: state.players[state.turn]?.id ?? "",
    hand: state.hands[userId] ?? [],
    stockTop: topOf(stock),
    stockCount: stock.length,
    bins: (state.bins[userId] ?? [[], [], [], []]).map(showBin),
    piles: state.piles.map((pile) => {
      const top = topOf(pile);
      return { n: top?.n ?? null, wild: top?.wild };
    }),
    others: state.players
      .filter((player) => player.id !== userId)
      .map((player) => ({
        id: player.id,
        name: player.name,
        stock: state.stock[player.id]?.length ?? 0,
        top: topOf(state.stock[player.id] ?? []),
        bins: (state.bins[player.id] ?? []).map(showBin),
      })),
    deck: state.deck.length,
    banner: state.banner,
    log: state.log,
    winnerIds: state.winnerIds,
  };
}
