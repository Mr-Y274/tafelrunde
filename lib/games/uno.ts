import { randomUUID } from "node:crypto";
import { PublicError } from "../errors";
import type { Action, Player, Tempo, UnoCard, UnoColor, UnoState, UnoValue, UnoView } from "./types";
import { pushLog, shuffle } from "./util";

const COLORS: UnoColor[] = ["rot", "gelb", "gruen", "blau"];
const NUMBERS: UnoValue[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "reverse", "draw2"];

function card(color: UnoColor | null, value: UnoValue): UnoCard {
  return { id: randomUUID(), color, value };
}

function freshDeck(): UnoCard[] {
  const cards: UnoCard[] = [];
  for (const color of COLORS) {
    cards.push(card(color, "0"));
    for (const value of NUMBERS) {
      cards.push(card(color, value), card(color, value));
    }
  }
  for (let i = 0; i < 4; i++) {
    cards.push(card(null, "wild"), card(null, "wild4"));
  }
  return cards;
}

export function colorLabel(color: UnoColor) {
  if (color === "rot") return "Rot";
  if (color === "gelb") return "Gelb";
  if (color === "gruen") return "Grün";
  return "Blau";
}

export function canPlayUno(cardToPlay: UnoCard, top: UnoCard, color: UnoColor) {
  if (cardToPlay.value === "wild" || cardToPlay.value === "wild4") return true;
  if (cardToPlay.color === color) return true;
  if (top.value !== "wild" && top.value !== "wild4" && cardToPlay.value === top.value) return true;
  return false;
}

function take(state: UnoState, count: number) {
  const drawn: UnoCard[] = [];
  for (let i = 0; i < count; i++) {
    if (state.drawPile.length === 0) {
      const top = state.discard.pop();
      state.drawPile = shuffle(state.discard);
      state.discard = top ? [top] : [];
    }
    const next = state.drawPile.pop();
    if (!next) break;
    drawn.push(next);
  }
  return drawn;
}

function step(state: UnoState, steps: number) {
  const count = state.players.length;
  state.turn = (state.turn + steps * state.dir + count * 8) % count;
}

function playerId(state: UnoState) {
  return state.players[state.turn]!.id;
}

function startHand(state: UnoState, startIndex: number) {
  const cards = shuffle(freshDeck());
  state.hands = {};
  for (const player of state.players) state.hands[player.id] = cards.splice(0, 7);
  let top = cards.pop()!;
  const buried: UnoCard[] = [];
  let guard = 0;
  while (top.value === "wild4" && cards.length > 0 && guard < 6) {
    buried.push(top);
    top = cards.pop()!;
    guard += 1;
  }
  cards.unshift(...buried);
  state.drawPile = cards;
  state.discard = [top];
  state.dir = 1;
  state.turn = startIndex;
  state.pendingDraw = 0;
  state.drawnId = null;
  state.catchable = null;
  state.saidUno = {};
  state.wild4HadColor = false;
  if (top.value === "wild") {
    state.phase = "opening-color";
    state.color = "rot";
    state.banner = `${state.players[startIndex]!.name} wählt die Startfarbe.`;
    return;
  }
  state.color = top.color ?? "rot";
  state.phase = "play";
  if (top.value === "skip") step(state, 1);
  else if (top.value === "reverse") {
    state.dir = -1;
    state.turn = state.players.length - 1;
  } else if (top.value === "draw2") {
    state.phase = "penalty";
    state.pendingDraw = 2;
    state.banner = `${state.players[state.turn]!.name} zieht 2 und setzt aus.`;
    return;
  }
  state.banner = `${state.players[state.turn]!.name} ist dran.`;
}

export function createUno(players: Player[], tempo: Tempo): UnoState {
  if (players.length < 2 || players.length > 8) throw new PublicError("Uno braucht 2 bis 8 Leute.");
  const state: UnoState = {
    kind: "uno",
    players,
    hands: {},
    drawPile: [],
    discard: [],
    color: "rot",
    dir: 1,
    turn: 0,
    phase: "play",
    pendingDraw: 0,
    drawnId: null,
    wild4HadColor: false,
    catchable: null,
    saidUno: {},
    scores: players.map(() => 0),
    target: tempo === "kurz" ? 100 : 200,
    banner: "",
    log: [],
  };
  startHand(state, 0);
  return state;
}

function pointsOf(cards: UnoCard[]) {
  return cards.reduce((sum, item) => {
    if (item.value === "wild" || item.value === "wild4") return sum + 50;
    if (item.value === "skip" || item.value === "reverse" || item.value === "draw2") return sum + 20;
    return sum + Number(item.value);
  }, 0);
}

function award(state: UnoState, winner: number) {
  const gained = state.players.reduce((sum, player, index) => {
    if (index === winner) return sum;
    return sum + pointsOf(state.hands[player.id] ?? []);
  }, 0);
  state.scores[winner] = (state.scores[winner] ?? 0) + gained;
  const name = state.players[winner]!.name;
  pushLog(state.log, `${name} wird die Karten los und holt ${gained}.`);
  if ((state.scores[winner] ?? 0) >= state.target) {
    state.phase = "done";
    state.winnerIds = [state.players[winner]!.id];
    state.banner = `${name} gewinnt mit ${state.scores[winner]} Punkten.`;
    pushLog(state.log, state.banner);
    return;
  }
  const note = `${name} holt ${gained} Punkte.`;
  startHand(state, winner);
  state.banner = `${note} ${state.banner}`;
}

function rememberUno(state: UnoState, userId: string, left: number, called: boolean) {
  if (left === 1) {
    state.saidUno[userId] = called;
    state.catchable = called ? null : userId;
    if (called) pushLog(state.log, `${state.players.find((player) => player.id === userId)?.name} sagt Uno.`);
    return;
  }
  state.saidUno[userId] = false;
  if (state.catchable === userId) state.catchable = null;
}

function afterCard(state: UnoState, item: UnoCard, previousColor: UnoColor, hadColor: boolean) {
  const count = state.players.length;
  if (item.value === "skip") {
    state.phase = "play";
    step(state, 2);
  } else if (item.value === "reverse") {
    state.dir = state.dir === 1 ? -1 : 1;
    state.phase = "play";
    step(state, count === 2 ? 2 : 1);
  } else if (item.value === "draw2") {
    step(state, 1);
    state.phase = "penalty";
    state.pendingDraw = 2;
    state.banner = `${state.players[state.turn]!.name} zieht 2.`;
    return;
  } else if (item.value === "wild4") {
    state.wild4HadColor = hadColor && previousColor === state.color ? hadColor : hadColor;
    step(state, 1);
    state.phase = "challenge";
    state.pendingDraw = 4;
    state.banner = `${state.players[state.turn]!.name} kann die +4 anzweifeln oder ziehen.`;
    return;
  } else {
    state.phase = "play";
    step(state, 1);
  }
  state.banner = `${state.players[state.turn]!.name} ist dran.`;
}

function requireTurn(state: UnoState, userId: string) {
  if (playerId(state) !== userId) throw new PublicError("Du bist nicht dran.");
}

export function applyUno(state: UnoState, userId: string, action: Action): UnoState {
  if (state.phase === "done") throw new PublicError("Die Partie ist vorbei.");
  if (!state.players.some((player) => player.id === userId)) throw new PublicError("Du sitzt nicht an diesem Tisch.");

  if (action.type === "uno-catch") {
    if (!state.catchable) throw new PublicError("Niemand hat Uno vergessen.");
    if (state.catchable === userId) throw new PublicError("Uno musst du selbst sagen.");
    const id = state.catchable;
    const hand = state.hands[id] ?? [];
    hand.push(...take(state, 2));
    state.hands[id] = hand;
    state.catchable = null;
    state.saidUno[id] = false;
    const name = state.players.find((player) => player.id === id)?.name ?? "Jemand";
    pushLog(state.log, `${name} hat Uno vergessen und zieht 2.`);
    state.banner = `${name} zieht zwei Strafkarten. ${state.players[state.turn]!.name} ist dran.`;
    return state;
  }

  if (state.catchable) state.catchable = null;

  if (action.type === "uno-color") {
    if (state.phase !== "opening-color") throw new PublicError("Gerade ist keine Startfarbe zu wählen.");
    requireTurn(state, userId);
    state.color = action.color;
    state.phase = "play";
    state.banner = `${colorLabel(action.color)}. ${state.players[state.turn]!.name} legt an.`;
    return state;
  }

  if (action.type === "uno-challenge") {
    if (state.phase !== "challenge") throw new PublicError("Gerade liegt keine +4.");
    requireTurn(state, userId);
    const accused = (state.turn - state.dir + state.players.length * 8) % state.players.length;
    if (action.challenge && state.wild4HadColor) {
      const id = state.players[accused]!.id;
      const hand = state.hands[id] ?? [];
      hand.push(...take(state, 4));
      state.hands[id] = hand;
      state.phase = "play";
      state.pendingDraw = 0;
      pushLog(state.log, `${state.players[accused]!.name} hatte die Farbe und zieht selbst 4.`);
      state.banner = `${state.players[state.turn]!.name} ist dran.`;
      return state;
    }
    const extra = action.challenge ? 6 : 4;
    const hand = state.hands[userId] ?? [];
    hand.push(...take(state, extra));
    state.hands[userId] = hand;
    state.phase = "play";
    state.pendingDraw = 0;
    if (action.challenge) pushLog(state.log, `Die +4 war erlaubt. ${state.players[state.turn]!.name} zieht 6.`);
    step(state, 1);
    state.banner = `${state.players[state.turn]!.name} ist dran.`;
    return state;
  }

  if (action.type === "uno-draw") {
    requireTurn(state, userId);
    if (state.phase === "penalty") {
      const hand = state.hands[userId] ?? [];
      hand.push(...take(state, state.pendingDraw));
      state.hands[userId] = hand;
      state.pendingDraw = 0;
      state.phase = "play";
      step(state, 1);
      state.banner = `${state.players[state.turn]!.name} ist dran.`;
      return state;
    }
    if (state.phase !== "play") throw new PublicError("Du kannst gerade nicht ziehen.");
    const [drawn] = take(state, 1);
    if (!drawn) throw new PublicError("Es sind keine Karten mehr da.");
    const hand = state.hands[userId] ?? [];
    hand.push(drawn);
    state.hands[userId] = hand;
    const top = state.discard[state.discard.length - 1]!;
    if (canPlayUno(drawn, top, state.color)) {
      state.phase = "drawn";
      state.drawnId = drawn.id;
      state.banner = "Du darfst die gezogene Karte legen oder passen.";
    } else {
      state.phase = "play";
      state.drawnId = null;
      step(state, 1);
      state.banner = `${state.players[state.turn]!.name} ist dran.`;
    }
    return state;
  }

  if (action.type === "uno-pass") {
    if (state.phase !== "drawn") throw new PublicError("Es gibt nichts zu passen.");
    requireTurn(state, userId);
    state.phase = "play";
    state.drawnId = null;
    step(state, 1);
    state.banner = `${state.players[state.turn]!.name} ist dran.`;
    return state;
  }

  if (action.type === "uno-play") {
    if (state.phase !== "play" && state.phase !== "drawn") throw new PublicError("Du kannst gerade keine Karte legen.");
    requireTurn(state, userId);
    if (state.phase === "drawn" && action.id !== state.drawnId) {
      throw new PublicError("Nach dem Ziehen darfst du nur diese Karte legen.");
    }
    const hand = state.hands[userId] ?? [];
    const at = hand.findIndex((item) => item.id === action.id);
    if (at < 0) throw new PublicError("Die Karte ist nicht auf deiner Hand.");
    const item = hand[at]!;
    const top = state.discard[state.discard.length - 1]!;
    if (!canPlayUno(item, top, state.color)) throw new PublicError("Die Karte passt nicht.");
    if ((item.value === "wild" || item.value === "wild4") && !action.color) {
      throw new PublicError("Wähl eine Farbe.");
    }
    const previous = state.color;
    const hadColor = hand.some((held) => held.color === previous);
    hand.splice(at, 1);
    state.hands[userId] = hand;
    state.discard.push(item);
    state.drawnId = null;
    if (item.color) state.color = item.color;
    if (item.value === "wild" || item.value === "wild4") state.color = action.color!;
    if (hand.length === 0) {
      award(state, state.turn);
      return state;
    }
    rememberUno(state, userId, hand.length, Boolean(action.uno));
    afterCard(state, item, previous, hadColor);
    return state;
  }

  throw new PublicError("Das geht bei Uno gerade nicht.");
}

export function viewUno(state: UnoState, userId: string): UnoView {
  const youAreUp = state.phase !== "done" && playerId(state) === userId;
  const hand = state.hands[userId] ?? [];
  const top = state.discard[state.discard.length - 1]!;
  let legalIds: string[] = [];
  if (youAreUp && state.phase === "play") legalIds = hand.filter((item) => canPlayUno(item, top, state.color)).map((item) => item.id);
  if (youAreUp && state.phase === "drawn" && state.drawnId) {
    const drawn = hand.find((item) => item.id === state.drawnId);
    if (drawn && canPlayUno(drawn, top, state.color)) legalIds = [drawn.id];
  }
  return {
    kind: "uno",
    phase: state.phase,
    youAreUp,
    canCatch: Boolean(state.catchable && state.catchable !== userId && state.phase !== "done"),
    turnId: state.players[state.turn]!.id,
    dir: state.dir,
    color: state.color,
    top,
    hand,
    legalIds,
    drawnId: youAreUp ? state.drawnId : null,
    pendingDraw: state.pendingDraw,
    rows: state.players.map((player, index) => ({
      id: player.id,
      name: player.name,
      cards: (state.hands[player.id] ?? []).length,
      score: state.scores[index] ?? 0,
    })),
    banner: state.banner,
    log: state.log,
    winnerIds: state.winnerIds,
    target: state.target,
    drawCount: state.drawPile.length,
  };
}

export function unoCardCount(state: UnoState) {
  const hands = Object.values(state.hands).reduce((sum, hand) => sum + hand.length, 0);
  return hands + state.drawPile.length + state.discard.length;
}
