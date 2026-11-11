import { PublicError } from "../errors";
import type { LoveAnimal } from "./love";
import type { Action, HerzCard, HerzGroup, HerzNeed, Player, Tempo, ZehnState, ZehnView } from "./types";
import { pushLog, shuffle } from "./util";

const PHASES: { label: string; groups: { kind: HerzNeed; n: number }[] }[] = [
  { label: "zwei Sätze zu je drei", groups: [{ kind: "satz", n: 3 }, { kind: "satz", n: 3 }] },
  { label: "ein Satz zu drei und eine Reihe zu vier", groups: [{ kind: "satz", n: 3 }, { kind: "reihe", n: 4 }] },
  { label: "ein Satz zu vier und eine Reihe zu vier", groups: [{ kind: "satz", n: 4 }, { kind: "reihe", n: 4 }] },
  { label: "eine Reihe zu sieben", groups: [{ kind: "reihe", n: 7 }] },
  { label: "eine Reihe zu acht", groups: [{ kind: "reihe", n: 8 }] },
  { label: "eine Reihe zu neun", groups: [{ kind: "reihe", n: 9 }] },
  { label: "zwei Sätze zu je vier", groups: [{ kind: "satz", n: 4 }, { kind: "satz", n: 4 }] },
  { label: "sieben Karten von einem Tier", groups: [{ kind: "familie", n: 7 }] },
  { label: "ein Satz zu fünf und ein Paar", groups: [{ kind: "satz", n: 5 }, { kind: "satz", n: 2 }] },
  { label: "ein Satz zu fünf und eine Reihe zu drei", groups: [{ kind: "satz", n: 5 }, { kind: "reihe", n: 3 }] },
];

const TITLES: Record<HerzNeed, string> = { satz: "Satz", reihe: "Reihe", familie: "Familie" };

function deckOf(): HerzCard[] {
  const cards: HerzCard[] = [];
  let n = 0;
  const animals: LoveAnimal[] = ["hase", "baer", "fuchs", "eule"];
  for (const animal of animals) {
    for (let value = 1; value <= 12; value++) {
      for (let copy = 0; copy < 2; copy++) cards.push({ id: `z${n++}`, kind: "zahl", animal, n: value });
    }
  }
  for (let i = 0; i < 8; i++) cards.push({ id: `z${n++}`, kind: "kuss", animal: null, n: null });
  for (let i = 0; i < 4; i++) cards.push({ id: `z${n++}`, kind: "schlaf", animal: null, n: null });
  return cards;
}

function valueOf(card: HerzCard) {
  if (card.kind === "kuss") return 15;
  if (card.kind === "schlaf") return 10;
  return card.n ?? 0;
}

function taskAt(index: number) {
  return PHASES[Math.min(index, PHASES.length - 1)]!;
}

function freshDeal(state: ZehnState, rng: () => number) {
  const pile = shuffle(deckOf(), rng);
  for (const player of state.players) state.hands[player.id] = pile.splice(0, 10);
  state.discard = [pile.pop()!];
  state.deck = pile;
  state.laid = [];
  state.down = {};
  state.skip = false;
  state.step = "draw";
}

export function createZehn(players: Player[], tempo: Tempo, rng: () => number = Math.random): ZehnState {
  const state: ZehnState = {
    kind: "zehn",
    players,
    goal: tempo === "voll" ? 10 : 4,
    phaseIndex: players.map(() => 0),
    hands: {},
    deck: [],
    discard: [],
    laid: [],
    down: {},
    phase: "play",
    turn: 0,
    step: "draw",
    skip: false,
    scores: players.map(() => 0),
    banner: `${players[0]?.name ?? "Jemand"} zieht.`,
    log: [],
  };
  freshDeal(state, rng);
  pushLog(state.log, "Die Aufgaben liegen bereit.");
  return state;
}

function actor(state: ZehnState, userId: string) {
  if (state.phase === "done") throw new PublicError("Die Runde ist vorbei.");
  const index = state.players.findIndex((player) => player.id === userId);
  if (index < 0) throw new PublicError("Du sitzt nicht an diesem Tisch.");
  if (index !== state.turn) throw new PublicError("Du bist nicht dran.");
  return state.players[index]!;
}

function takeDeck(state: ZehnState) {
  if (state.deck.length === 0) {
    if (state.discard.length <= 1) throw new PublicError("Keine Karten mehr.");
    const top = state.discard.pop()!;
    state.deck = shuffle(state.discard, Math.random);
    state.discard = [top];
  }
  return state.deck.pop()!;
}

function resolve(kind: HerzNeed, cards: HerzCard[]): HerzGroup | null {
  if (cards.some((card) => card.kind === "schlaf")) return null;
  if (kind === "satz") {
    const numbers = cards.filter((card) => card.kind === "zahl").map((card) => card.n ?? 0);
    if (new Set(numbers).size > 1) return null;
    const face = numbers[0] ?? 0;
    return { owner: "", kind, face, animal: null, low: face, high: face, cards: cards.map((card) => ({ ...card, n: card.kind === "kuss" ? face || null : card.n })) };
  }
  if (kind === "familie") {
    const animals = cards.filter((card) => card.kind === "zahl").map((card) => card.animal);
    if (new Set(animals).size > 1) return null;
    const animal = animals[0] ?? null;
    return { owner: "", kind, face: 0, animal, low: 0, high: 0, cards: cards.map((card) => ({ ...card, animal: card.kind === "kuss" ? animal : card.animal })) };
  }
  const known = cards.flatMap((card) => (card.kind === "zahl" && card.n ? [card.n] : []));
  if (new Set(known).size !== known.length) return null;
  const len = cards.length;
  const min = known.length ? Math.min(...known) : 1;
  const max = known.length ? Math.max(...known) : len;
  const startMin = known.length ? max - (len - 1) : 1;
  const startMax = known.length ? min : 1;
  for (let start = Math.max(1, startMin); start <= startMax && start + len - 1 <= 12; start++) {
    const open: number[] = [];
    for (let n = start; n < start + len; n++) if (!known.includes(n)) open.push(n);
    if (open.length !== len - known.length) continue;
    let wild = 0;
    const placed = cards.map((card) => {
      if (card.kind === "zahl") return card;
      const face = open[wild++] ?? start;
      return { ...card, n: face };
    });
    return { owner: "", kind, face: 0, animal: null, low: start, high: start + len - 1, cards: placed };
  }
  return null;
}

function pass(state: ZehnState) {
  const count = state.players.length;
  let next = (state.turn + 1) % count;
  if (state.skip) {
    state.skip = false;
    next = (next + 1) % count;
  }
  state.turn = next;
  state.step = "draw";
  state.banner = `${state.players[next]!.name} zieht.`;
}

function closeRound(state: ZehnState, outIndex: number) {
  const out = state.players[outIndex]!;
  const won = Boolean(state.down[out.id]) && state.phaseIndex[outIndex] === state.goal - 1;
  for (let i = 0; i < state.players.length; i++) {
    const id = state.players[i]!.id;
    state.scores[i] = (state.scores[i] ?? 0) + (state.hands[id] ?? []).reduce((sum, card) => sum + valueOf(card), 0);
    if (state.down[id] && (state.phaseIndex[i] ?? 0) < state.goal - 1) state.phaseIndex[i] = (state.phaseIndex[i] ?? 0) + 1;
  }
  if (won) {
    state.phase = "done";
    state.winnerIds = [out.id];
    state.banner = `${out.name} hat die letzte Aufgabe geschafft.`;
    pushLog(state.log, state.banner);
    return;
  }
  const next = (outIndex + 1) % state.players.length;
  state.turn = next;
  freshDeal(state, Math.random);
  state.banner = `Neue Runde. ${state.players[next]!.name} zieht.`;
  pushLog(state.log, `${out.name} ist raus. Die Aufgaben rücken vor.`);
}

export function applyZehn(state: ZehnState, userId: string, action: Action): ZehnState {
  const player = actor(state, userId);
  const hand = state.hands[player.id] ?? [];

  if (action.type === "zehn-draw") {
    if (state.step !== "draw") throw new PublicError("Du hast schon gezogen.");
    if (action.from === "ablage") {
      const top = state.discard.at(-1);
      if (!top) throw new PublicError("Die Ablage ist leer.");
      if (top.kind === "schlaf") throw new PublicError("Schlaf bleibt liegen.");
      state.discard.pop();
      hand.push(top);
    } else hand.push(takeDeck(state));
    state.hands[player.id] = hand;
    state.step = "play";
    state.banner = `${player.name} darf legen oder ablegen.`;
    return state;
  }

  if (state.step !== "play") throw new PublicError("Zieh zuerst eine Karte.");

  if (action.type === "zehn-lay") {
    if (state.down[player.id]) throw new PublicError("Deine Aufgabe liegt schon.");
    const task = taskAt(state.phaseIndex[state.turn] ?? 0);
    if (action.groups.length !== task.groups.length) throw new PublicError("Die Gruppen passen nicht zur Aufgabe.");
    const used = new Set<string>();
    const built: HerzGroup[] = [];
    for (let i = 0; i < task.groups.length; i++) {
      const need = task.groups[i]!;
      const ids = action.groups[i] ?? [];
      if (ids.length !== need.n) throw new PublicError(`Die ${TITLES[need.kind]} braucht ${need.n} Karten.`);
      const cards = ids.map((id) => {
        if (used.has(id)) throw new PublicError("Eine Karte liegt doppelt.");
        used.add(id);
        const card = hand.find((item) => item.id === id);
        if (!card) throw new PublicError("Die Karte ist nicht auf deiner Hand.");
        return card;
      });
      const group = resolve(need.kind, cards);
      if (!group) throw new PublicError("So ist das noch kein Satz, keine Reihe und keine Familie.");
      group.owner = player.id;
      built.push(group);
    }
    if (used.size >= hand.length) throw new PublicError("Eine Karte muss zum Ablegen bleiben.");
    state.hands[player.id] = hand.filter((card) => !used.has(card.id));
    state.laid.push(...built);
    state.down[player.id] = true;
    state.banner = `${player.name} hat die Aufgabe gelegt.`;
    pushLog(state.log, state.banner);
    return state;
  }

  if (action.type === "zehn-hit") {
    if (!state.down[player.id]) throw new PublicError("Erst die eigene Aufgabe legen.");
    const card = hand.find((item) => item.id === action.id);
    if (!card) throw new PublicError("Die Karte ist nicht auf deiner Hand.");
    if (card.kind === "schlaf") throw new PublicError("Schlaf legt man nur ab.");
    if (hand.length < 2) throw new PublicError("Die letzte Karte wird abgelegt.");
    const group = state.laid[action.group];
    if (!group) throw new PublicError("Die Gruppe gibt es nicht.");
    if (group.kind === "satz") {
      const face = card.kind === "kuss" ? group.face : card.n ?? 0;
      if (group.face !== 0 && card.kind === "zahl" && card.n !== group.face) throw new PublicError("Der Satz hat eine andere Zahl.");
      if (group.face === 0 && card.kind === "zahl") {
        group.face = card.n ?? 0;
        group.low = group.face;
        group.high = group.face;
      }
      group.cards.push({ ...card, n: card.kind === "kuss" ? group.face || null : card.n });
    } else if (group.kind === "familie") {
      if (group.animal && card.kind === "zahl" && card.animal !== group.animal) throw new PublicError("Das ist ein anderes Tier.");
      if (!group.animal && card.kind === "zahl") group.animal = card.animal;
      group.cards.push({ ...card, animal: card.kind === "kuss" ? group.animal : card.animal });
    } else {
      const low = group.low;
      const high = group.high;
      let face = card.n ?? 0;
      if (card.kind === "kuss") {
        const canLow = low > 1;
        const canHigh = high < 12;
        if (!canLow && !canHigh) throw new PublicError("Die Reihe ist voll.");
        const edge = action.edge ?? (canLow && !canHigh ? "low" : !canLow && canHigh ? "high" : undefined);
        if (!edge) throw new PublicError("Sag, an welches Ende der Kuss soll.");
        if (edge === "low" && !canLow) throw new PublicError("Tiefer als 1 geht nicht.");
        if (edge === "high" && !canHigh) throw new PublicError("Höher als 12 geht nicht.");
        face = edge === "low" ? low - 1 : high + 1;
      } else if (face === low - 1 && low > 1) {
        group.low = face;
      } else if (face === high + 1 && high < 12) {
        group.high = face;
      } else throw new PublicError("Die Reihe nimmt diese Zahl nicht.");
      if (card.kind === "kuss") {
        if (face === low - 1) group.low = face;
        if (face === high + 1) group.high = face;
      }
      group.cards.push({ ...card, n: face });
    }
    state.hands[player.id] = hand.filter((item) => item.id !== card.id);
    state.banner = `${player.name} legt an.`;
    return state;
  }

  if (action.type === "zehn-discard") {
    const card = hand.find((item) => item.id === action.id);
    if (!card) throw new PublicError("Die Karte ist nicht auf deiner Hand.");
    state.hands[player.id] = hand.filter((item) => item.id !== card.id);
    state.discard.push(card);
    if (card.kind === "schlaf") state.skip = true;
    if (state.hands[player.id]!.length === 0) {
      closeRound(state, state.turn);
      return state;
    }
    pushLog(state.log, `${player.name} legt ab${card.kind === "schlaf" ? " und jemand schläft" : ""}.`);
    pass(state);
    return state;
  }

  throw new PublicError("Das gehört nicht zu diesem Spiel.");
}

export function viewZehn(state: ZehnState, userId: string): ZehnView {
  const index = state.players.findIndex((player) => player.id === userId);
  const task = taskAt(state.phaseIndex[index] ?? 0);
  return {
    kind: "zehn",
    phase: state.phase === "done" ? "done" : state.step,
    youAreUp: state.phase !== "done" && index === state.turn,
    youDown: Boolean(state.down[userId]),
    turnId: state.players[state.turn]?.id ?? "",
    goal: state.goal,
    deck: state.deck.length,
    discard: state.discard.at(-1) ?? null,
    hand: state.hands[userId] ?? [],
    laid: state.laid.map((group) => ({
      owner: state.players.find((player) => player.id === group.owner)?.name ?? "",
      kind: group.kind,
      cards: group.cards,
    })),
    task: {
      label: task.label,
      groups: task.groups.map((group) => ({ ...group, title: `${TITLES[group.kind]} ${group.n}` })),
    },
    rows: state.players.map((player, seat) => ({
      id: player.id,
      name: player.name,
      phase: (state.phaseIndex[seat] ?? 0) + 1,
      cards: state.hands[player.id]?.length ?? 0,
      score: state.scores[seat] ?? 0,
      down: Boolean(state.down[player.id]),
    })),
    banner: state.banner,
    log: state.log,
    winnerIds: state.winnerIds,
  };
}

export function zehnCardCount(state: ZehnState) {
  const hands = Object.values(state.hands).reduce((sum, hand) => sum + hand.length, 0);
  const laid = state.laid.reduce((sum, group) => sum + group.cards.length, 0);
  return hands + laid + state.deck.length + state.discard.length;
}
