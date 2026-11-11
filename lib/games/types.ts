import type { LoveAnimal } from "./love";

export type GameId = "wizard" | "schiffe" | "scotland" | "uno" | "pictionary" | "zehn" | "stapel" | "memo" | "vier" | "mau";
export type Tempo = "kurz" | "voll";
export type Player = { id: string; name: string };

export type Suit = "rot" | "gelb" | "gruen" | "blau";
export type WCard =
  | { id: string; t: "n"; suit: Suit; rank: number }
  | { id: string; t: "W" }
  | { id: string; t: "J" };

export type UnoColor = "rot" | "gelb" | "gruen" | "blau";
export type UnoValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "skip"
  | "reverse"
  | "draw2"
  | "wild"
  | "wild4";

export type UnoCard = {
  id: string;
  color: UnoColor | null;
  value: UnoValue;
};

export type TicketName = "taxi" | "bus" | "ug" | "black" | "double" | "heli";
export type TravelTicket = "taxi" | "bus" | "ug" | "black";
export type Ride = TravelTicket | "heli";

export type ShipId = "schlacht" | "kreuzer" | "zerstorer" | "uboot" | "boot";
export type ShipSpec = { id: ShipId; x: number; y: number; dir: "h" | "v" };
export type Ship = { id: ShipId; cells: [number, number][] };
export type Shot = { x: number; y: number; hit: boolean; sunk?: ShipId };

export type SketchStroke = { color: string; size: number; points: [number, number][] };

export type WizardState = {
  kind: "wizard";
  players: Player[];
  dealer: number;
  round: number;
  maxRounds: number;
  phase: "trump" | "bid" | "play" | "done";
  hands: Record<string, WCard[]>;
  trumpCard: WCard | null;
  trumpSuit: Suit | null;
  needsTrumpChoice: boolean;
  bids: (number | null)[];
  won: number[];
  turn: number;
  trick: { player: number; card: WCard }[];
  scores: number[];
  banner: string;
  log: string[];
  winnerIds?: string[];
  deck: WCard[];
  lastRound: { bids: number[]; won: number[]; delta: number[] } | null;
};

export type SchiffeState = {
  kind: "schiffe";
  players: Player[];
  phase: "placement" | "battle" | "done";
  starterIndex: number;
  turn: string | null;
  ready: Record<string, boolean>;
  ships: Record<string, Ship[]>;
  shots: Record<string, Shot[]>;
  banner: string;
  log: string[];
  winnerIds?: string[];
};

export type UnoState = {
  kind: "uno";
  players: Player[];
  hands: Record<string, UnoCard[]>;
  drawPile: UnoCard[];
  discard: UnoCard[];
  color: UnoColor;
  dir: 1 | -1;
  turn: number;
  phase: "play" | "drawn" | "penalty" | "challenge" | "opening-color" | "done";
  pendingDraw: number;
  drawnId: string | null;
  wild4HadColor: boolean;
  catchable: string | null;
  saidUno: Record<string, boolean>;
  scores: number[];
  target: number;
  banner: string;
  log: string[];
  winnerIds?: string[];
};

export type ScotlandTickets = Record<TicketName, number>;

export type ScotlandState = {
  kind: "scotland";
  players: Player[];
  mrX: string;
  detectives: string[];
  positions: Record<string, number | null>;
  tickets: Record<string, ScotlandTickets>;
  round: number;
  maxRounds: number;
  reveals: number[];
  phase: "mrx-start" | "det-start" | "mrx" | "det" | "done";
  picker: number;
  moves: { round: number; ticket: Ride; station: number }[];
  meetings: number[];
  meetHits: number[];
  city: "london" | "paris" | "barcelona";
  probed: boolean;
  probe: ScotlandProbe | null;
  banner: string;
  log: string[];
  winnerIds?: string[];
  caughtBy?: string;
};

export type PictionaryState = {
  kind: "pictionary";
  players: Player[];
  scores: number[];
  drawer: number;
  laps: number;
  skipsLeft: number;
  board: number;
  word: string;
  category: string;
  used: string[];
  strokes: SketchStroke[];
  guesses: { name: string; text: string }[];
  turnEndsAt: number;
  phase: "draw" | "done";
  banner: string;
  log: string[];
  winnerIds?: string[];
};

export type HerzKind = "zahl" | "kuss" | "schlaf";
export type HerzCard = { id: string; kind: HerzKind; animal: LoveAnimal | null; n: number | null };
export type HerzNeed = "satz" | "reihe" | "familie";
export type HerzGroup = {
  owner: string;
  kind: HerzNeed;
  face: number;
  animal: LoveAnimal | null;
  low: number;
  high: number;
  cards: HerzCard[];
};

export type ZehnState = {
  kind: "zehn";
  players: Player[];
  goal: number;
  phase: "play" | "done";
  phaseIndex: number[];
  hands: Record<string, HerzCard[]>;
  deck: HerzCard[];
  discard: HerzCard[];
  laid: HerzGroup[];
  down: Record<string, boolean>;
  turn: number;
  step: "draw" | "play";
  skip: boolean;
  scores: number[];
  banner: string;
  log: string[];
  winnerIds?: string[];
};

export type StapelCard = { id: string; n: number | null; wild?: boolean };
export type StapelState = {
  kind: "stapel";
  players: Player[];
  stock: Record<string, StapelCard[]>;
  hands: Record<string, StapelCard[]>;
  bins: Record<string, StapelCard[][]>;
  piles: StapelCard[][];
  box: StapelCard[];
  deck: StapelCard[];
  turn: number;
  phase: "play" | "done";
  banner: string;
  log: string[];
  winnerIds?: string[];
};

export type MemoState = {
  kind: "memo";
  players: Player[];
  tiles: { animal: string; mark: string; up: boolean; owner: number | null }[];
  cols: number;
  open: number[];
  turn: number;
  scores: number[];
  phase: "flip" | "show" | "done";
  banner: string;
  log: string[];
  winnerIds?: string[];
};

export type VierState = {
  kind: "vier";
  players: Player[];
  cells: (number | null)[];
  turn: number;
  phase: "play" | "done";
  win: number[];
  banner: string;
  log: string[];
  winnerIds?: string[];
};

export type MauRank = "7" | "8" | "9" | "10" | "B" | "D" | "K" | "A";
export type MauCard = { id: string; animal: LoveAnimal; rank: MauRank };
export type MauState = {
  kind: "mau";
  players: Player[];
  hands: Record<string, MauCard[]>;
  deck: MauCard[];
  burned: MauCard[];
  top: MauCard;
  animal: LoveAnimal;
  dir: 1 | -1;
  turn: number;
  pending: number;
  phase: "play" | "drawn" | "done";
  drawnId: string | null;
  banner: string;
  log: string[];
  winnerIds?: string[];
};

export type GameState = WizardState | SchiffeState | UnoState | ScotlandState | PictionaryState | ZehnState | StapelState | MemoState | VierState | MauState;

export type WizardView = {
  kind: "wizard";
  phase: WizardState["phase"];
  round: number;
  maxRounds: number;
  trumpCard: WCard | null;
  trumpSuit: Suit | null;
  needsTrumpChoice: boolean;
  dealerId: string;
  turnId: string;
  youAreUp: boolean;
  hand: WCard[];
  legalIds: string[];
  trick: { name: string; card: WCard }[];
  rows: { id: string; name: string; bid: number | null; won: number; score: number }[];
  banner: string;
  log: string[];
  winnerIds?: string[];
  cardsThisRound: number;
  yourBid: number | null;
  lastRound: WizardState["lastRound"];
};

export type SchiffeView = {
  kind: "schiffe";
  phase: SchiffeState["phase"];
  youAreUp: boolean;
  turnId: string | null;
  youPlaced: boolean;
  foePlaced: boolean;
  foeId: string;
  yourShips: { id: ShipId; cells: [number, number][]; sunk: boolean }[];
  incoming: Shot[];
  outgoing: Shot[];
  sunkFoe: ShipId[];
  foeShips?: { id: ShipId; cells: [number, number][]; sunk: boolean }[];
  winnerIds?: string[];
  banner: string;
  log: string[];
};

export type UnoView = {
  kind: "uno";
  phase: UnoState["phase"];
  youAreUp: boolean;
  canCatch: boolean;
  turnId: string;
  dir: 1 | -1;
  color: UnoColor;
  top: UnoCard;
  hand: UnoCard[];
  legalIds: string[];
  drawnId: string | null;
  pendingDraw: number;
  rows: { id: string; name: string; cards: number; score: number }[];
  banner: string;
  log: string[];
  winnerIds?: string[];
  target: number;
  drawCount: number;
};

export type ScotlandMove = {
  to: number;
  ticket: Ride;
  doubleTo?: number;
  doubleTicket?: TravelTicket;
};

export type ScotlandProbe =
  | { kind: "analyse"; stations: number[] }
  | { kind: "ortung"; masts: { id: number; name: string; band: "nah" | "mittel" | "fern" }[] }
  | { kind: "abtasten"; steps: number }
  | { kind: "befragung"; witnesses: { id: number; name: string; saw: "hier" | "vor kurzem" | "still" }[] };

export type ScotlandView = {
  kind: "scotland";
  phase: ScotlandState["phase"];
  youAreUp: boolean;
  youAreMrX: boolean;
  city: "london" | "paris" | "barcelona";
  mrXId: string;
  round: number;
  maxRounds: number;
  reveals: number[];
  turnId: string | null;
  positions: { id: string; name: string; role: "mrx" | "det"; station: number | null }[];
  tickets: ScotlandTickets;
  travel: { round: number; ticket: Ride; station: number | null }[];
  lastSeen: { round: number; station: number } | null;
  choices: number[] | null;
  home: number | null;
  moves: ScotlandMove[];
  specials: { black: number; double: number; heli: number };
  meetHits: number;
  meetings: { station: number; hit: boolean }[] | null;
  sights: { id: number; name: string }[];
  masts: { id: number; name: string }[];
  probeReady: boolean;
  probe: ScotlandProbe | null;
  banner: string;
  log: string[];
  winnerIds?: string[];
  caughtBy?: string;
};

export type PictionaryView = {
  kind: "pictionary";
  phase: PictionaryState["phase"];
  youDraw: boolean;
  youCanGuess: boolean;
  drawerId: string;
  drawerName: string;
  category: string;
  word?: string;
  strokes: SketchStroke[];
  guesses: { name: string; text: string }[];
  turnEndsAt: number;
  scores: { id: string; name: string; score: number }[];
  banner: string;
  log: string[];
  round: number;
  rounds: number;
  skipsLeft: number;
  board: number;
  winnerIds?: string[];
};

export type ZehnView = {
  kind: "zehn";
  phase: ZehnState["step"] | "done";
  youAreUp: boolean;
  youDown: boolean;
  turnId: string;
  goal: number;
  deck: number;
  discard: HerzCard | null;
  hand: HerzCard[];
  laid: { owner: string; kind: HerzNeed; cards: HerzCard[] }[];
  task: { label: string; groups: { kind: HerzNeed; n: number; title: string }[] };
  rows: { id: string; name: string; phase: number; cards: number; score: number; down: boolean }[];
  banner: string;
  log: string[];
  winnerIds?: string[];
};

export type StapelView = {
  kind: "stapel";
  phase: StapelState["phase"];
  youAreUp: boolean;
  turnId: string;
  hand: StapelCard[];
  stockTop: StapelCard | null;
  stockCount: number;
  bins: { n: number | null; wild?: boolean; count: number }[];
  piles: { n: number | null; wild?: boolean }[];
  others: { id: string; name: string; stock: number; top: StapelCard | null; bins: { n: number | null; wild?: boolean; count: number }[] }[];
  deck: number;
  banner: string;
  log: string[];
  winnerIds?: string[];
};

export type MemoView = {
  kind: "memo";
  phase: MemoState["phase"];
  youAreUp: boolean;
  turnId: string;
  cols: number;
  tiles: { hidden: boolean; animal?: string; mark?: string; owner?: string }[];
  scores: { id: string; name: string; score: number }[];
  banner: string;
  log: string[];
  winnerIds?: string[];
};

export type VierView = {
  kind: "vier";
  phase: VierState["phase"];
  youAreUp: boolean;
  turnId: string;
  you: number;
  cells: (number | null)[];
  win: number[];
  rows: { id: string; name: string; mark: string }[];
  banner: string;
  log: string[];
  winnerIds?: string[];
};

export type MauView = {
  kind: "mau";
  phase: MauState["phase"];
  youAreUp: boolean;
  turnId: string;
  animal: LoveAnimal;
  top: MauCard;
  hand: MauCard[];
  legalIds: string[];
  pending: number;
  dir: 1 | -1;
  deck: number;
  rows: { id: string; name: string; cards: number }[];
  banner: string;
  log: string[];
  winnerIds?: string[];
};

export type GameView = WizardView | SchiffeView | UnoView | ScotlandView | PictionaryView | ZehnView | StapelView | MemoView | VierView | MauView;

export type Action =
  | { type: "place"; ships: ShipSpec[] }
  | { type: "shoot"; x: number; y: number }
  | { type: "bid"; n: number }
  | { type: "trump"; suit: Suit }
  | { type: "card"; id: string }
  | { type: "uno-play"; id: string; color?: UnoColor; uno?: boolean }
  | { type: "uno-draw" }
  | { type: "uno-pass" }
  | { type: "uno-challenge"; challenge: boolean }
  | { type: "uno-color"; color: UnoColor }
  | { type: "uno-catch" }
  | { type: "sy-start"; station: number }
  | { type: "sy-move"; to: number; ticket: Ride; doubleTo?: number; doubleTicket?: TravelTicket }
  | { type: "sy-probe"; kind: "analyse" | "ortung" | "abtasten" | "befragung" }
  | { type: "stroke"; color: string; size: number; points: [number, number][] }
  | { type: "undo" }
  | { type: "clear" }
  | { type: "skip" }
  | { type: "guess"; text: string }
  | { type: "zehn-draw"; from: "deck" | "ablage" }
  | { type: "zehn-lay"; groups: string[][] }
  | { type: "zehn-hit"; group: number; id: string; edge?: "low" | "high" }
  | { type: "zehn-discard"; id: string }
  | { type: "stapel-play"; from: "hand" | "stock" | "ablage"; id?: string; pile: number; slot?: number }
  | { type: "stapel-end"; id?: string; slot: number }
  | { type: "memo-flip"; index: number }
  | { type: "memo-hide" }
  | { type: "vier-drop"; col: number }
  | { type: "mau-play"; id: string; animal?: LoveAnimal }
  | { type: "mau-draw" }
  | { type: "mau-keep" };
