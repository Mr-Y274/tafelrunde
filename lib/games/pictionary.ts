import { PublicError } from "../errors";
import { PEN_SIZES, PENCILS } from "./sketch";
import type { Action, PictionaryState, PictionaryView, Player, Tempo } from "./types";
import { pushLog } from "./util";

const WORDS: { word: string; category: string }[] = [
  { word: "Leuchtturm", category: "Ort" },
  { word: "Regenschirm", category: "Ding" },
  { word: "Schneemann", category: "Ding" },
  { word: "Heißluftballon", category: "Ding" },
  { word: "Zahnbürste", category: "Ding" },
  { word: "Schlüssel", category: "Ding" },
  { word: "Brille", category: "Ding" },
  { word: "Anker", category: "Ding" },
  { word: "Kompass", category: "Ding" },
  { word: "Trompete", category: "Ding" },
  { word: "Schaukel", category: "Ding" },
  { word: "Kaktus", category: "Ding" },
  { word: "Igel", category: "Tier" },
  { word: "Pinguin", category: "Tier" },
  { word: "Giraffe", category: "Tier" },
  { word: "Qualle", category: "Tier" },
  { word: "Marienkäfer", category: "Tier" },
  { word: "Känguru", category: "Tier" },
  { word: "Chamäleon", category: "Tier" },
  { word: "Biber", category: "Tier" },
  { word: "Flamingo", category: "Tier" },
  { word: "Seepferdchen", category: "Tier" },
  { word: "Gitarre", category: "Ding" },
  { word: "Vulkan", category: "Ort" },
  { word: "Windmühle", category: "Ort" },
  { word: "Burg", category: "Ort" },
  { word: "Zelt", category: "Ding" },
  { word: "Hängematte", category: "Ding" },
  { word: "Lagerfeuer", category: "Ding" },
  { word: "Schatzkarte", category: "Ding" },
  { word: "Piratenhut", category: "Ding" },
  { word: "Rakete", category: "Ding" },
  { word: "U-Boot", category: "Ding" },
  { word: "Heuwagen", category: "Ding" },
  { word: "Schneeschuh", category: "Ding" },
  { word: "Seilbahn", category: "Ding" },
  { word: "Leiter", category: "Ding" },
  { word: "Briefmarke", category: "Ding" },
  { word: "Popcorn", category: "Ding" },
  { word: "Waffeleisen", category: "Ding" },
  { word: "Teekanne", category: "Ding" },
  { word: "Kerze", category: "Ding" },
  { word: "Drachen", category: "Ding" },
  { word: "Seifenblase", category: "Ding" },
  { word: "Angel", category: "Ding" },
  { word: "Fernglas", category: "Ding" },
  { word: "Sandburg", category: "Ding" },
  { word: "Wasserfall", category: "Ort" },
  { word: "Insel", category: "Ort" },
  { word: "Brücke", category: "Ort" },
  { word: "Bäcker", category: "Mensch" },
  { word: "Taucher", category: "Mensch" },
  { word: "Dirigent", category: "Mensch" },
  { word: "Gärtner", category: "Mensch" },
  { word: "Astronaut", category: "Mensch" },
  { word: "Jongleur", category: "Mensch" },
  { word: "Niesen", category: "Tun" },
  { word: "Klettern", category: "Tun" },
  { word: "Schaukeln", category: "Tun" },
  { word: "Angeln", category: "Tun" },
  { word: "Schneeballschlacht", category: "Tun" },
  { word: "Verstecken", category: "Tun" },
  { word: "Frühstücken", category: "Tun" },
  { word: "Staubsaugen", category: "Tun" },
  { word: "Winken", category: "Tun" },
  { word: "Balancieren", category: "Tun" },
  { word: "Mond", category: "Natur" },
  { word: "Regenbogen", category: "Natur" },
  { word: "Blitz", category: "Natur" },
  { word: "Eiszapfen", category: "Natur" },
  { word: "Sonnenblume", category: "Natur" },
  { word: "Pilz", category: "Natur" },
  { word: "Koralle", category: "Natur" },
  { word: "Nest", category: "Natur" },
  { word: "Spinne", category: "Tier" },
  { word: "Schildkröte", category: "Tier" },
  { word: "Einhorn", category: "Wesen" },
  { word: "Drache", category: "Wesen" },
  { word: "Geist", category: "Wesen" },
  { word: "Roboter", category: "Ding" },
  { word: "Zeitmaschine", category: "Ding" },
  { word: "Schatztruhe", category: "Ding" },
  { word: "Kommode", category: "Ding" },
  { word: "Hängelampe", category: "Ding" },
  { word: "Bügeleisen", category: "Ding" },
  { word: "Nudelholz", category: "Ding" },
  { word: "Pfannkuchen", category: "Ding" },
  { word: "Brezel", category: "Ding" },
  { word: "Erdbeere", category: "Ding" },
  { word: "Zitrone", category: "Ding" },
  { word: "Koffer", category: "Ding" },
  { word: "Fahrstuhl", category: "Ding" },
  { word: "Rolltreppe", category: "Ding" },
  { word: "Ampel", category: "Ding" },
  { word: "Hydrant", category: "Ding" },
  { word: "Briefkasten", category: "Ding" },
  { word: "Vogelscheuche", category: "Ding" },
];

export function decoyWord(category: string, secret: string, taken: string[], rng: () => number) {
  const pool = WORDS.filter((item) => item.category === category && item.word !== secret && !taken.includes(item.word));
  const wider = pool.length > 0 ? pool : WORDS.filter((item) => item.word !== secret && !taken.includes(item.word));
  const choice = wider.length > 0 ? wider : WORDS;
  return choice[Math.floor(rng() * choice.length)]!.word;
}

export function normalizeGuess(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]/g, "");
}

function pickWord(state: PictionaryState, rng: () => number) {
  const blocked = new Set(state.used);
  if (state.word) blocked.add(state.word);
  const fresh = WORDS.filter((item) => !blocked.has(item.word));
  const pool = fresh.length > 0 ? fresh : WORDS.filter((item) => item.word !== state.word);
  const choice = pool.length > 0 ? pool : WORDS;
  return choice[Math.floor(rng() * choice.length)]!;
}

function remember(state: PictionaryState) {
  if (state.word && !state.used.includes(state.word)) state.used.push(state.word);
}

function dealWord(state: PictionaryState, rng: () => number, now: number) {
  remember(state);
  const picked = pickWord(state, rng);
  state.word = picked.word;
  state.category = picked.category;
  state.strokes = [];
  state.guesses = [];
  state.turnEndsAt = now + 70_000;
  state.phase = "draw";
  state.board = (state.board ?? 0) + 1;
}

function lapsOf(state: PictionaryState) {
  return state.laps === 3 ? 3 : 1;
}

function drawerSeat(state: PictionaryState) {
  const count = state.players.length;
  const picture = state.phase === "done" ? Math.max(0, state.drawer - 1) : state.drawer;
  return picture % count;
}

function openTurn(state: PictionaryState, rng: () => number, now: number, lead = "") {
  state.skipsLeft = 3;
  dealWord(state, rng, now);
  const who = state.players[drawerSeat(state)]!.name;
  state.banner = `${lead}${lead ? " " : ""}${who} zeichnet · ${state.category}`.trim();
}

export function createPictionary(players: Player[], tempo: Tempo, rng: () => number = Math.random, now = Date.now()): PictionaryState {
  if (players.length < 2 || players.length > 8) throw new PublicError("Pictionary braucht 2 bis 8 Leute.");
  const state: PictionaryState = {
    kind: "pictionary",
    players,
    scores: players.map(() => 0),
    drawer: 0,
    laps: tempo === "voll" ? 3 : 1,
    skipsLeft: 3,
    board: 0,
    word: "",
    category: "",
    used: [],
    strokes: [],
    guesses: [],
    turnEndsAt: now,
    phase: "draw",
    banner: "",
    log: [],
  };
  openTurn(state, rng, now);
  return state;
}

function finishMatch(state: PictionaryState, lead: string) {
  const best = Math.max(...state.scores);
  state.phase = "done";
  state.word = "";
  state.winnerIds = state.players.filter((_, index) => state.scores[index] === best).map((player) => player.id);
  const names = state.players.filter((_, index) => state.scores[index] === best).map((player) => player.name);
  state.banner = `${lead}${lead ? " " : ""}${names.join(" und ")} gewinnt mit ${best} Punkten.`.trim();
  pushLog(state.log, state.banner);
}

function advance(state: PictionaryState, now: number, lead: string) {
  if (state.word) state.used.push(state.word);
  state.drawer += 1;
  if (state.drawer >= state.players.length * lapsOf(state)) {
    finishMatch(state, lead);
    return;
  }
  openTurn(state, Math.random, now, lead);
}

export function tickPictionary(state: PictionaryState, now = Date.now()) {
  if (state.phase !== "draw" || now < state.turnEndsAt) return false;
  const lead = `Die Zeit ist um. Es war „${state.word}“.`;
  pushLog(state.log, lead);
  advance(state, now, lead);
  return true;
}

export function applyPictionary(state: PictionaryState, userId: string, action: Action, now = Date.now()): PictionaryState {
  if (state.phase === "done") throw new PublicError("Die Runde ist vorbei.");
  const drawer = state.players[drawerSeat(state)];
  if (!drawer) throw new PublicError("Niemand zeichnet.");
  if (now >= state.turnEndsAt) {
    tickPictionary(state, now);
    throw new PublicError("Die Zeit ist um.");
  }

  if (action.type === "skip") {
    if (drawer.id !== userId) throw new PublicError("Nur die zeichnende Person kann skippen.");
    const left = state.skipsLeft ?? 3;
    if (left <= 0) throw new PublicError("Du kannst nur dreimal skippen.");
    state.skipsLeft = left - 1;
    dealWord(state, Math.random, now);
    state.banner = `${drawer.name} nimmt ein neues Wort.`;
    pushLog(state.log, state.banner);
    return state;
  }

  if (action.type === "stroke" || action.type === "undo" || action.type === "clear") {
    if (drawer.id !== userId) throw new PublicError("Den Stift hat gerade jemand anders.");
    if (action.type === "undo") {
      state.strokes.pop();
      return state;
    }
    if (action.type === "clear") {
      state.strokes = [];
      return state;
    }
    if (!PENCILS.includes(action.color as (typeof PENCILS)[number])) throw new PublicError("Diese Farbe gibt es nicht.");
    if (!PEN_SIZES.includes(action.size as (typeof PEN_SIZES)[number])) throw new PublicError("Diese Strichstärke gibt es nicht.");
    if (action.points.length < 1 || action.points.length > 200) throw new PublicError("Der Strich ist ungültig.");
    if (state.strokes.length >= 300) throw new PublicError("Das Blatt ist voll.");
    const points = action.points.map(([x, y]) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new PublicError("Der Strich ist ungültig.");
      return [Math.max(0, Math.min(1000, Math.round(x))), Math.max(0, Math.min(1000, Math.round(y)))] as [number, number];
    });
    state.strokes.push({ color: action.color, size: action.size, points });
    return state;
  }

  if (action.type === "guess") {
    if (drawer.id === userId) throw new PublicError("Du kennst das Wort schon.");
    const text = action.text.trim();
    if (text.length < 1 || text.length > 40) throw new PublicError("Der Tipp passt nicht.");
    const guesser = state.players.find((player) => player.id === userId);
    if (!guesser) throw new PublicError("Du sitzt nicht an diesem Tisch.");
    if (normalizeGuess(text) === normalizeGuess(state.word)) {
      const guesserIndex = state.players.findIndex((player) => player.id === userId);
      const seat = drawerSeat(state);
      state.scores[guesserIndex] = (state.scores[guesserIndex] ?? 0) + 10;
      state.scores[seat] = (state.scores[seat] ?? 0) + 10;
      const lead = `${guesser.name} trifft „${state.word}“.`;
      pushLog(state.log, lead);
      advance(state, now, lead);
      return state;
    }
    state.guesses.push({ name: guesser.name, text });
    if (state.guesses.length > 8) state.guesses.shift();
    pushLog(state.log, `${guesser.name} tippt „${text}“.`);
    return state;
  }

  throw new PublicError("Das geht bei Pictionary gerade nicht.");
}

export function viewPictionary(state: PictionaryState, userId: string): PictionaryView {
  const drawer = state.players[drawerSeat(state)];
  const total = state.players.length * lapsOf(state);
  const youDraw = drawer?.id === userId && state.phase === "draw";
  return {
    kind: "pictionary",
    phase: state.phase,
    youDraw,
    youCanGuess: state.phase === "draw" && !youDraw,
    drawerId: drawer?.id ?? "",
    drawerName: drawer?.name ?? "",
    category: state.category,
    word: youDraw ? state.word : undefined,
    strokes: state.strokes,
    guesses: state.guesses,
    turnEndsAt: state.turnEndsAt,
    scores: state.players.map((player, index) => ({ id: player.id, name: player.name, score: state.scores[index] ?? 0 })),
    banner: state.banner,
    log: state.log,
    round: Math.min(state.drawer + 1, total),
    rounds: total,
    skipsLeft: state.skipsLeft ?? 3,
    board: state.board ?? 0,
    winnerIds: state.winnerIds,
  };
}
