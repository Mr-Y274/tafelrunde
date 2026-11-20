import { PublicError } from "../errors";
import type { Action, Player, RiskoCard, RiskoState, RiskoView, Tempo } from "./types";
import { RISKO_LANDS, RISKO_REALMS, riskoConnected, riskoLand, riskoNeighbors, tradeValue } from "./risko-map";
import { pushLog, shuffle } from "./util";

export const RISKO_COLORS = ["#d6453d", "#e2b43a", "#2f8f5b", "#3b6fd0", "#8d5bd1", "#e07a3a"];
const COLOR_NAMES = ["Rot", "Gelb", "Grün", "Blau", "Violett", "Orange"];

type Mission =
  | { id: string; kind: "lands"; n: number; minArmies?: number; text: string }
  | { id: string; kind: "continents"; need: string[]; extra: number; text: string }
  | { id: string; kind: "wipe"; color: number; text: string };

export const RISKO_MISSIONS: Mission[] = [
  { id: "lands-24", kind: "lands", n: 24, text: "Erobere 24 Gebiete." },
  { id: "lands-18", kind: "lands", n: 18, minArmies: 2, text: "Erobere 18 Gebiete und halte auf jedem mindestens 2 Armeen." },
  { id: "na-af", kind: "continents", need: ["nordamerika", "afrika"], extra: 0, text: "Erobere Nordamerika und Afrika." },
  { id: "na-au", kind: "continents", need: ["nordamerika", "australien"], extra: 0, text: "Erobere Nordamerika und Australien." },
  { id: "as-sa", kind: "continents", need: ["asien", "suedamerika"], extra: 0, text: "Erobere Asien und Südamerika." },
  { id: "as-af", kind: "continents", need: ["asien", "afrika"], extra: 0, text: "Erobere Asien und Afrika." },
  { id: "eu-sa", kind: "continents", need: ["europa", "suedamerika"], extra: 1, text: "Erobere Europa, Südamerika und einen dritten Kontinent." },
  { id: "eu-au", kind: "continents", need: ["europa", "australien"], extra: 1, text: "Erobere Europa, Australien und einen dritten Kontinent." },
  ...COLOR_NAMES.map((name, color) => ({ id: `wipe-${color}`, kind: "wipe" as const, color, text: `Vernichte alle Armeen der Farbe ${name}.` })),
];

function missionById(id: string) {
  return RISKO_MISSIONS.find((mission) => mission.id === id) ?? RISKO_MISSIONS[0]!;
}

function armiesFor(count: number) {
  return [0, 0, 40, 35, 30, 25, 20][count] ?? 20;
}

function ownedBy(state: RiskoState, player: number) {
  return Object.values(state.lands).filter((land) => land.owner === player).length;
}

function holdsRealm(state: RiskoState, player: number, realm: string) {
  return RISKO_LANDS.filter((land) => land.realm === realm).every((land) => state.lands[land.id]?.owner === player);
}

function income(state: RiskoState, player: number) {
  const owned = ownedBy(state, player);
  if (owned === 0) return 0;
  const bonus = RISKO_REALMS.reduce((sum, realm) => sum + (holdsRealm(state, player, realm.id) ? realm.bonus : 0), 0);
  return Math.max(3, Math.floor(owned / 3)) + bonus;
}

function living(state: RiskoState) {
  return state.players.map((_, index) => index).filter((index) => ownedBy(state, index) > 0);
}

export function riskoDice(seed: number, count: number) {
  const dice: number[] = [];
  let next = seed >>> 0;
  for (let i = 0; i < count; i++) {
    next = (Math.imul(next, 1664525) + 1013904223) >>> 0;
    dice.push(((next >>> 16) % 6) + 1);
  }
  return { seed: next, dice: dice.sort((a, b) => b - a) };
}

export function riskoIsSet(symbols: string[]) {
  if (symbols.length !== 3) return false;
  const rest = symbols.filter((symbol) => symbol !== "joker");
  if (rest.length === 0) return false;
  if (rest.every((symbol) => symbol === rest[0])) return true;
  return new Set(rest).size === rest.length;
}

function drawDice(state: RiskoState, count: number) {
  const rolled = riskoDice(state.seed, count);
  state.seed = rolled.seed;
  return rolled.dice;
}

function landName(id: string) {
  return riskoLand(id)?.name ?? "Gebiet";
}

function handOf(state: RiskoState, player: number) {
  return state.hands[player] ?? [];
}

function missionDone(state: RiskoState, player: number) {
  const mission = missionById(state.missions[player] ?? "lands-24");
  if (mission.kind === "lands") {
    const lands = Object.values(state.lands).filter((land) => land.owner === player && land.armies >= (mission.minArmies ?? 1));
    return lands.length >= mission.n;
  }
  if (mission.kind === "wipe") {
    return state.eliminatedBy[mission.color] === player && ownedBy(state, mission.color) === 0;
  }
  const held = RISKO_REALMS.filter((realm) => holdsRealm(state, player, realm.id)).map((realm) => realm.id);
  return mission.need.every((realm) => held.includes(realm)) && held.length >= mission.need.length + mission.extra;
}

function finish(state: RiskoState, winner: number) {
  state.phase = "done";
  state.occupy = null;
  state.pool = state.pool.map(() => 0);
  state.winnerIds = [state.players[winner]!.id];
  state.banner = `${state.players[winner]!.name} gewinnt.`;
  pushLog(state.log, state.banner);
}

function checkWinner(state: RiskoState) {
  if (state.phase === "draft" || state.phase === "done") return false;
  const left = living(state);
  if (left.length <= 1) {
    finish(state, left[0] ?? state.turn);
    return true;
  }
  const player = state.turn;
  if (state.mode === "welt") {
    if (ownedBy(state, player) >= RISKO_LANDS.length) {
      finish(state, player);
      return true;
    }
    return false;
  }
  if (missionDone(state, player)) {
    finish(state, player);
    return true;
  }
  return false;
}

function openTrade(state: RiskoState, resume: RiskoState["resume"]) {
  state.phase = "trade";
  state.resume = resume;
  state.banner = `${state.players[state.turn]!.name} muss Karten eintauschen. Der Satz bringt ${tradeValue(state.trades)} Armeen.`;
}

function afterCards(state: RiskoState) {
  if (state.phase === "done") return;
  if (handOf(state, state.turn).length >= 5) {
    openTrade(state, state.phase === "trade" ? state.resume : state.resume);
    return;
  }
  if (state.phase !== "trade") return;
  const next = state.resume;
  if (next === "place") {
    state.phase = "place";
    state.banner = `${state.players[state.turn]!.name} setzt ${state.pool[state.turn] ?? 0} Armeen.`;
    return;
  }
  if ((state.pool[state.turn] ?? 0) > 0) {
    state.phase = "place";
    state.banner = `${state.players[state.turn]!.name} setzt ${state.pool[state.turn]} Tauscharmeen.`;
    return;
  }
  state.phase = next;
  state.resume = "place";
  state.banner = next === "fortify" ? `${state.players[state.turn]!.name} darf einmal verschieben.` : `${state.players[state.turn]!.name} darf angreifen.`;
}

function beginTurn(state: RiskoState, start: number) {
  if (checkWinner(state)) return;
  let next = start;
  for (let step = 0; step < state.players.length; step++) {
    if (ownedBy(state, next) > 0) break;
    next = (next + 1) % state.players.length;
  }
  state.turn = next;
  state.conquered = false;
  state.cardTaken = false;
  state.occupy = null;
  state.resume = "place";
  state.pool = state.pool.map(() => 0);
  state.pool[next] = income(state, next);
  if (handOf(state, next).length >= 5) {
    openTrade(state, "place");
    return;
  }
  state.phase = "place";
  state.banner = `${state.players[next]!.name} bekommt ${state.pool[next]} Armeen.`;
  pushLog(state.log, state.banner);
}

function afterReserve(state: RiskoState) {
  const player = state.turn;
  if ((state.pool[player] ?? 0) > 0) {
    state.banner = `${state.players[player]!.name} setzt noch ${state.pool[player]} Armeen.`;
    return;
  }
  if (state.phase === "draft") {
    for (let step = 1; step <= state.players.length; step++) {
      const next = (player + step) % state.players.length;
      if ((state.pool[next] ?? 0) > 0) {
        state.turn = next;
        state.banner = `${state.players[next]!.name} setzt noch ${state.pool[next]} Armeen.`;
        return;
      }
    }
    beginTurn(state, 0);
    return;
  }
  if (state.resume === "attack" || state.resume === "fortify") {
    state.phase = state.resume;
    state.resume = "place";
    state.banner = state.phase === "fortify" ? `${state.players[player]!.name} darf einmal verschieben.` : `${state.players[player]!.name} darf angreifen.`;
    return;
  }
  state.phase = "attack";
  state.banner = `${state.players[player]!.name} darf angreifen.`;
}

function takeCards(state: RiskoState, victim: number, killer: number) {
  const loot = handOf(state, victim);
  if (loot.length === 0) return;
  state.hands[killer] = [...handOf(state, killer), ...loot];
  state.hands[victim] = [];
  pushLog(state.log, `${state.players[killer]!.name} nimmt die Karten von ${state.players[victim]!.name}.`);
}

function requirePlayer(state: RiskoState, userId: string) {
  const index = state.players.findIndex((player) => player.id === userId);
  if (index < 0) throw new PublicError("Du sitzt nicht an diesem Tisch.");
  if (state.phase === "done") throw new PublicError("Die Runde ist vorbei.");
  if (index !== state.turn) throw new PublicError("Du bist nicht dran.");
  return index;
}

function buildDeck(rng: () => number) {
  const cards: RiskoCard[] = RISKO_LANDS.map((land) => ({ id: land.id, land: land.id, symbol: land.symbol }));
  cards.push({ id: "joker-a", land: null, symbol: "joker" }, { id: "joker-b", land: null, symbol: "joker" });
  return shuffle(cards, rng);
}

export function createRisko(players: Player[], tempo: Tempo, rng: () => number = Math.random): RiskoState {
  if (players.length < 2 || players.length > 6) throw new PublicError("Risko braucht 2 bis 6 Personen.");
  const pool: number[] = players.map(() => armiesFor(players.length));
  const lands: RiskoState["lands"] = {};
  const dealt = shuffle(RISKO_LANDS.map((land) => land.id), rng);
  dealt.forEach((id, index) => {
    const owner = index % players.length;
    lands[id] = { owner, armies: 1 };
    pool[owner] = (pool[owner] ?? 0) - 1;
  });
  const missions = shuffle(RISKO_MISSIONS.map((mission) => mission.id), rng).slice(0, players.length);
  const state: RiskoState = {
    kind: "risko",
    players,
    tempo,
    mode: tempo === "kurz" ? "auftrag" : "welt",
    goal: RISKO_LANDS.length,
    lands,
    pool,
    turn: 0,
    phase: "draft",
    seed: Math.floor(rng() * 0x100000000) >>> 0,
    last: null,
    banner: `${players[0]?.name ?? "Jemand"} setzt noch ${pool[0] ?? 0} Armeen.`,
    log: [],
    deck: buildDeck(rng),
    hands: players.map(() => []),
    trades: 0,
    conquered: false,
    cardTaken: false,
    resume: "place",
    occupy: null,
    missions: missions.map((id, index) => {
      const mission = missionById(id);
      if (mission.kind === "wipe" && (mission.color === index || mission.color >= players.length)) return "lands-24";
      return id;
    }),
    eliminatedBy: players.map(() => -1),
  };
  pushLog(state.log, state.mode === "auftrag" ? "42 Gebiete. Geheimaufträge liegen verdeckt." : "42 Gebiete. Ziel ist die Welteroberung.");
  if ((pool[0] ?? 0) <= 0) afterReserve(state);
  return state;
}

function trade(state: RiskoState, index: number, action: Extract<Action, { type: "risko-trade" }>) {
  if (state.phase !== "trade" && state.phase !== "place") throw new PublicError("Jetzt werden keine Karten getauscht.");
  if (action.ids.length !== 3 || new Set(action.ids).size !== 3) throw new PublicError("Ein Satz hat drei verschiedene Karten.");
  const hand = handOf(state, index);
  const cards = action.ids.map((id) => hand.find((card) => card.id === id));
  if (cards.some((card) => !card)) throw new PublicError("Die Karte liegt nicht auf deiner Hand.");
  const picked = cards as RiskoCard[];
  if (!riskoIsSet(picked.map((card) => card.symbol))) throw new PublicError("Der Satz passt nicht. Drei gleiche Symbole oder je eines.");
  const owned = picked.map((card) => card.land).filter((id): id is string => id != null && state.lands[id]?.owner === index);
  if (owned.length > 1 && (!action.onto || !owned.includes(action.onto))) {
    throw new PublicError("Wähle das Gebiet für die zwei Extraarmeen.");
  }
  const bonus = owned.length === 1 ? owned[0]! : owned.length > 1 ? action.onto! : null;
  const gain = tradeValue(state.trades);
  state.trades += 1;
  state.hands[index] = hand.filter((card) => !action.ids.includes(card.id));
  state.pool[index] = (state.pool[index] ?? 0) + gain;
  if (bonus) state.lands[bonus]!.armies += 2;
  pushLog(state.log, `${state.players[index]!.name} tauscht Karten und bekommt ${gain} Armeen${bonus ? `, plus 2 auf ${landName(bonus)}` : ""}.`);
  if (checkWinner(state)) return;
  afterCards(state);
}

export function applyRisko(state: RiskoState, userId: string, action: Action): RiskoState {
  const index = requirePlayer(state, userId);
  if (action.type === "risko-trade") {
    trade(state, index, action);
    return state;
  }
  if (action.type === "risko-place" || action.type === "risko-dump") {
    if (state.phase === "trade" || handOf(state, index).length >= 5) throw new PublicError("Du musst erst Karten eintauschen.");
    if (state.phase !== "draft" && state.phase !== "place") throw new PublicError("Jetzt wird nicht gesetzt.");
    const land = state.lands[action.id];
    if (!land || land.owner !== index) throw new PublicError("Das Gebiet gehört dir nicht.");
    const left = state.pool[index] ?? 0;
    const amount = action.type === "risko-dump" ? left : 1;
    if (amount < 1) throw new PublicError("Du hast keine Armeen mehr.");
    land.armies += amount;
    state.pool[index] = left - amount;
    pushLog(state.log, `${state.players[index]!.name} setzt ${amount} auf ${landName(action.id)}.`);
    if (checkWinner(state)) return state;
    afterReserve(state);
    return state;
  }
  if (action.type === "risko-attack") {
    if (state.phase !== "attack") throw new PublicError("Jetzt wird nicht angegriffen.");
    const from = state.lands[action.from];
    const to = state.lands[action.to];
    if (!from || from.owner !== index) throw new PublicError("Von dort greifst du nicht an.");
    if (from.armies < 2) throw new PublicError("Eine Armee muss im Gebiet bleiben.");
    if (!to || to.owner === index) throw new PublicError("Das Gebiet gehört schon dir.");
    if (!riskoNeighbors(action.from).includes(action.to)) throw new PublicError("Die Gebiete grenzen nicht aneinander.");
    const dice = action.dice ?? Math.min(3, from.armies - 1);
    if (dice < 1 || dice > Math.min(3, from.armies - 1)) throw new PublicError("So viele Angriffswürfel gehen nicht.");
    const defendDice = Math.min(2, to.armies);
    const attack = drawDice(state, dice);
    const defend = drawDice(state, defendDice);
    const pairs = Math.min(attack.length, defend.length);
    for (let i = 0; i < pairs; i++) {
      if (attack[i]! > defend[i]!) to.armies -= 1;
      else from.armies -= 1;
    }
    state.last = { from: action.from, to: action.to, attack, defend };
    const attacker = state.players[index]!.name;
    if (to.armies <= 0) {
      const victim = to.owner;
      to.owner = index;
      to.armies = 0;
      state.conquered = true;
      const min = Math.min(dice, Math.max(1, from.armies - 1));
      const max = from.armies - 1;
      pushLog(state.log, `${attacker} nimmt ${landName(action.to)} ein.`);
      if (ownedBy(state, victim) === 0) {
        state.eliminatedBy[victim] = index;
        takeCards(state, victim, index);
        for (let player = 0; player < state.players.length; player++) {
          if (player === index) continue;
          const mission = missionById(state.missions[player] ?? "");
          if (mission.kind === "wipe" && mission.color === victim) state.missions[player] = "lands-24";
        }
      }
      const ended =
        living(state).length <= 1 ||
        (state.mode === "welt" && ownedBy(state, index) >= RISKO_LANDS.length) ||
        (state.mode === "auftrag" && missionDone(state, index));
      if (ended) {
        from.armies -= min;
        to.armies = min;
        state.occupy = null;
        checkWinner(state);
        return state;
      }
      state.occupy = { from: action.from, to: action.to, min, max };
      state.phase = "occupy";
      state.banner =
        handOf(state, index).length >= 5
          ? `${attacker} zieht mindestens ${min} Armeen nach und tauscht danach Karten.`
          : `${attacker} zieht mindestens ${min} Armeen nach ${landName(action.to)}.`;
      return state;
    }
    pushLog(state.log, `${attacker} würfelt ${attack.join(" ")} gegen ${defend.join(" ")}.`);
    state.banner = `${attacker} greift ${landName(action.to)} an. Gleichstand hält das Gebiet.`;
    return state;
  }
  if (action.type === "risko-occupy") {
    if (state.phase !== "occupy" || !state.occupy) throw new PublicError("Jetzt zieht niemand nach.");
    const { from: fromId, to: toId, min, max } = state.occupy;
    const from = state.lands[fromId]!;
    const to = state.lands[toId]!;
    if (action.n < min || action.n > max) throw new PublicError(`Du ziehst mindestens ${min} und höchstens ${max} Armeen nach.`);
    from.armies -= action.n;
    to.armies += action.n;
    state.occupy = null;
    pushLog(state.log, `${state.players[index]!.name} zieht ${action.n} nach ${landName(toId)}.`);
    if (checkWinner(state)) return state;
    if (handOf(state, index).length >= 5) {
      openTrade(state, "attack");
      return state;
    }
    state.phase = "attack";
    state.banner = `${state.players[index]!.name} darf weiter angreifen.`;
    return state;
  }
  if (action.type === "risko-halt") {
    if (state.phase !== "attack") throw new PublicError("Jetzt läuft kein Angriff.");
    if (state.conquered && !state.cardTaken && state.deck.length > 0) {
      const card = state.deck.pop()!;
      state.hands[index] = [...handOf(state, index), card];
      state.cardTaken = true;
      pushLog(state.log, `${state.players[index]!.name} zieht eine Gebietskarte.`);
    }
    if (handOf(state, index).length >= 5) {
      openTrade(state, "fortify");
      return state;
    }
    state.phase = "fortify";
    state.banner = `${state.players[index]!.name} darf einmal verschieben.`;
    return state;
  }
  if (action.type === "risko-fortify") {
    if (state.phase !== "fortify") throw new PublicError("Jetzt wird nicht verschoben.");
    const from = state.lands[action.from];
    const to = state.lands[action.to];
    if (!from || !to || from.owner !== index || to.owner !== index) throw new PublicError("Beide Gebiete müssen dir gehören.");
    if (action.from === action.to) throw new PublicError("Die Armeen bleiben im selben Gebiet.");
    if (from.armies < 2) throw new PublicError("Eine Armee muss im Gebiet bleiben.");
    const owners = Object.fromEntries(Object.entries(state.lands).map(([id, land]) => [id, land.owner]));
    if (!riskoConnected(owners, action.from, action.to)) throw new PublicError("Die Gebiete hängen nicht über eigene Gebiete zusammen.");
    const move = action.n ?? from.armies - 1;
    if (move < 1 || move > from.armies - 1) throw new PublicError("So viele Armeen kannst du nicht verschieben.");
    from.armies -= move;
    to.armies += move;
    pushLog(state.log, `${state.players[index]!.name} verschiebt ${move} nach ${landName(action.to)}.`);
    if (checkWinner(state)) return state;
    beginTurn(state, (index + 1) % state.players.length);
    return state;
  }
  if (action.type === "risko-end") {
    if (state.phase !== "fortify") throw new PublicError("Der Zug ist noch nicht so weit.");
    beginTurn(state, (index + 1) % state.players.length);
    return state;
  }
  throw new PublicError("Das gehört nicht zu diesem Spiel.");
}

export function viewRisko(state: RiskoState, userId: string): RiskoView {
  const you = state.players.findIndex((player) => player.id === userId);
  const missionId = you >= 0 ? state.missions[you] : null;
  return {
    kind: "risko",
    phase: state.phase,
    tempo: state.tempo,
    mode: state.mode,
    goal: state.goal,
    youAreUp: you === state.turn && state.phase !== "done",
    turnId: state.players[state.turn]!.id,
    you,
    turnPool: state.pool[state.turn] ?? 0,
    mustTrade: state.phase === "trade" || (state.phase === "place" && handOf(state, state.turn).length >= 5),
    tradeValue: tradeValue(state.trades),
    trades: state.trades,
    deck: state.deck.length,
    conquered: state.conquered,
    occupy: state.occupy,
    mission: state.mode === "auftrag" && missionId ? missionById(missionId).text : null,
    hand: (you >= 0 ? handOf(state, you) : []).map((card) => ({
      id: card.id,
      land: card.land,
      name: card.land ? landName(card.land) : "Joker",
      symbol: card.symbol,
    })),
    lands: RISKO_LANDS.map((land) => {
      const spot = state.lands[land.id]!;
      return { id: land.id, owner: spot.owner, armies: spot.armies };
    }),
    rows: state.players.map((player, index) => ({
      id: player.id,
      name: player.name,
      color: RISKO_COLORS[index] ?? "#f3eadc",
      lands: ownedBy(state, index),
      armies: Object.values(state.lands).filter((land) => land.owner === index).reduce((sum, land) => sum + land.armies, 0) + (state.pool[index] ?? 0),
      cards: handOf(state, index).length,
      out: ownedBy(state, index) === 0 && state.phase !== "draft",
    })),
    last: state.last,
    banner: state.banner,
    log: state.log,
    winnerIds: state.winnerIds,
  };
}
