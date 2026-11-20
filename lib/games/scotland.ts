import { PublicError } from "../errors";
import { cityLinks, cityMap, type CityId } from "./city-maps";
import type { Action, Player, Ride, ScotlandMove, ScotlandState, ScotlandTickets, ScotlandView, Tempo, TravelTicket } from "./types";
import { pushLog, shuffle } from "./util";

const TRAVEL: TravelTicket[] = ["taxi", "bus", "ug", "black"];
const REVEALS = [3, 8, 13, 18, 24];

function bag(role: "mrx" | "det", detectives = 0): ScotlandTickets {
  return role === "mrx"
    ? { taxi: 4, bus: 3, ug: 3, black: detectives, double: 2, heli: 0 }
    : { taxi: 10, bus: 8, ug: 4, black: 0, double: 0, heli: 0 };
}

function ticketLabel(ticket: Ride) {
  if (ticket === "taxi") return "Taxi";
  if (ticket === "bus") return "Bus";
  if (ticket === "ug") return "U-Bahn";
  return "Schwarz";
}

function destinations(city: CityId, from: number, ticket: TravelTicket) {
  if (ticket === "black") {
    const found = new Set<number>();
    for (const mode of ["taxi", "bus", "ug", "water"] as const) for (const next of cityLinks(city, from, mode)) found.add(next);
    return [...found];
  }
  return cityLinks(city, from, ticket);
}

function occupiedByDetective(state: ScotlandState, station: number, except?: string) {
  return state.detectives.some((id) => id !== except && state.positions[id] === station);
}

function stepsFrom(state: ScotlandState, userId: string, from: number) {
  const mine = state.tickets[userId];
  if (!mine) return [];
  const found: { to: number; ticket: TravelTicket }[] = [];
  for (const ticket of TRAVEL) {
    if ((mine[ticket] ?? 0) <= 0) continue;
    for (const to of destinations(state.city, from, ticket)) {
      if (userId !== state.mrX && occupiedByDetective(state, to, userId)) continue;
      found.push({ to, ticket });
    }
  }
  return found;
}

export function scotlandMoves(state: ScotlandState, userId: string): ScotlandMove[] {
  const from = state.positions[userId];
  if (from == null) return [];
  const mine = state.tickets[userId];
  if (!mine) return [];
  const singles = stepsFrom(state, userId, from).map((step) => ({ to: step.to, ticket: step.ticket }));
  if (userId !== state.mrX || mine.double <= 0 || state.round >= state.maxRounds) return singles;
  const doubles: ScotlandMove[] = [];
  for (const first of singles) {
    const left: ScotlandTickets = { ...mine, [first.ticket]: mine[first.ticket] - 1 };
    const secondState = { ...state, tickets: { ...state.tickets, [userId]: left }, positions: { ...state.positions, [userId]: first.to } };
    for (const second of stepsFrom(secondState, userId, first.to)) {
      doubles.push({ to: first.to, ticket: first.ticket, doubleTo: second.to, doubleTicket: second.ticket });
    }
  }
  return [...singles, ...doubles];
}

function actor(state: ScotlandState) {
  if (state.phase === "done") return null;
  if (state.phase === "mrx-start" || state.phase === "mrx") return state.mrX;
  return state.detectives[state.picker] ?? null;
}

function ownerOf(state: ScotlandState, id: string) {
  return state.controls?.[id] ?? id;
}

function detectiveSide(state: ScotlandState) {
  return [...new Set(state.detectives.map((id) => ownerOf(state, id)))];
}

function nameOf(state: ScotlandState, id: string) {
  const owner = ownerOf(state, id);
  const name = state.players.find((player) => player.id === owner)?.name ?? "Jemand";
  if (owner === id) return name;
  const mine = state.detectives.filter((piece) => ownerOf(state, piece) === owner);
  const index = mine.indexOf(id);
  return index > 0 ? `${name} ${index + 1}` : name;
}

function caught(state: ScotlandState, by: string) {
  state.phase = "done";
  state.caughtBy = by;
  state.winnerIds = detectiveSide(state);
  state.banner = `${nameOf(state, by)} fasst Mr. X.`;
  pushLog(state.log, state.banner);
}

function mrXWins(state: ScotlandState, banner: string) {
  state.phase = "done";
  state.winnerIds = [state.mrX];
  state.banner = banner;
  pushLog(state.log, state.banner);
}

function finishDetectives(state: ScotlandState) {
  if (state.round >= state.maxRounds) {
    mrXWins(state, "24 Züge sind um. Mr. X entkommt.");
    return;
  }
  state.round += 1;
  state.phase = "mrx";
  if (scotlandMoves(state, state.mrX).length === 0) {
    state.phase = "done";
    state.winnerIds = detectiveSide(state);
    state.banner = "Mr. X sitzt fest.";
    pushLog(state.log, state.banner);
    return;
  }
  state.banner = state.reveals.includes(state.round) ? "Mr. X muss sich zeigen." : "Mr. X ist unterwegs.";
}

function skipStuck(state: ScotlandState) {
  let guard = 0;
  while (state.phase === "det" && guard <= state.detectives.length) {
    const id = state.detectives[state.picker];
    if (!id) {
      finishDetectives(state);
      return;
    }
    if (scotlandMoves(state, id).some((move) => move.doubleTo == null)) {
      state.banner = `${nameOf(state, id)} sucht eine Fahrt.`;
      return;
    }
    pushLog(state.log, `${nameOf(state, id)} kommt nicht weiter und setzt aus.`);
    state.picker += 1;
    guard += 1;
    if (state.picker >= state.detectives.length) {
      finishDetectives(state);
      return;
    }
  }
}

function beginDetectives(state: ScotlandState) {
  state.phase = "det";
  state.picker = 0;
  const anyone = state.detectives.some((id) => scotlandMoves(state, id).some((move) => move.doubleTo == null));
  if (!anyone) {
    mrXWins(state, "Kein Detektiv kommt noch weiter.");
    return;
  }
  skipStuck(state);
}

function hopWords(city: CityId, from: number, to: number, ticket: Ride) {
  if (ticket === "black" && cityLinks(city, from, "water").includes(to)) return { mit: "der Fähre", nimmt: "die Fähre" };
  const label = ticketLabel(ticket);
  return { mit: `dem ${label}`, nimmt: `das ${label}` };
}

function note(state: ScotlandState, round: number, takes: string, at: number) {
  if (state.reveals.includes(round)) pushLog(state.log, `Runde ${round}: Mr. X taucht bei ${at} auf, ${takes}.`);
  else pushLog(state.log, `Runde ${round}: Mr. X nimmt ${takes}.`);
}

function handOver(state: ScotlandState, ticket: Ride) {
  if (ticket !== "taxi" && ticket !== "bus" && ticket !== "ug") return;
  const mine = state.tickets[state.mrX];
  if (mine) mine[ticket] += 1;
}

function isBot(id: string) {
  return id.startsWith("00000000-0000-4000-8000-");
}

export function createScotland(players: Player[], _tempo: Tempo, rng: () => number = Math.random, city: CityId = "london"): ScotlandState {
  if (players.length < 2 || players.length > 6) throw new PublicError("Scotland Yard braucht 2 bis 6 Leute.");
  const humans = players.filter((player) => !isBot(player.id));
  const bot = players.find((player) => isBot(player.id));
  const mrIndex = humans.length === 1 && bot && players.length === 2 ? players.findIndex((player) => player.id === bot.id) : Math.floor(rng() * players.length);
  const mrX = players[mrIndex]!.id;
  const seated = players.filter((player) => player.id !== mrX).map((player) => player.id);
  const owners = seated.filter((id) => !isBot(id));
  const controls: Record<string, string> = {};
  const detectives = [...seated];
  for (const id of detectives) controls[id] = id;
  let extra = 0;
  while (detectives.length < 3 && owners.length > 0) {
    const owner = owners[extra % owners.length]!;
    const id = `${owner}#${extra + 2}`;
    detectives.push(id);
    controls[id] = owner;
    extra += 1;
  }
  const map = cityMap(city);
  const deck = shuffle([...map.starts], rng);
  if (deck.length < detectives.length + 1) throw new PublicError("Zu wenige Startfelder.");
  const positions: Record<string, number | null> = {};
  const tickets: Record<string, ScotlandTickets> = {};
  positions[mrX] = deck[0]!;
  tickets[mrX] = bag("mrx", detectives.length);
  detectives.forEach((id, index) => {
    positions[id] = deck[index + 1]!;
    tickets[id] = bag("det");
  });
  const banner = `${players[mrIndex]!.name} ist Mr. X in ${map.name}. Die Startfelder sind gezogen.`;
  return {
    kind: "scotland",
    players,
    mrX,
    detectives,
    controls,
    positions,
    tickets,
    city,
    round: 1,
    maxRounds: 24,
    reveals: REVEALS,
    phase: "mrx",
    picker: 0,
    moves: [],
    meetings: [],
    meetHits: [],
    probed: false,
    probe: null,
    banner,
    log: [banner],
  };
}

export function applyScotland(state: ScotlandState, userId: string, action: Action): ScotlandState {
  if (state.city !== "london" && state.city !== "paris" && state.city !== "barcelona") state.city = "london";
  if (state.phase === "done") throw new PublicError("Die Jagd ist vorbei.");
  const piece = actor(state);
  if (!piece || ownerOf(state, piece) !== userId) throw new PublicError("Du bist nicht dran.");

  if (action.type === "sy-start") {
    if (state.phase !== "mrx-start" && state.phase !== "det-start") throw new PublicError("Die Startfelder sind schon gewählt.");
    if (!cityMap(state.city).starts.includes(action.station)) throw new PublicError("Das ist kein Startfeld.");
    if (state.phase === "mrx-start") {
      state.positions[state.mrX] = action.station;
      state.phase = "det-start";
      state.picker = 0;
      state.banner = `${nameOf(state, state.detectives[0]!)} wählt einen Start.`;
      return state;
    }
    if (occupiedByDetective(state, action.station, piece)) throw new PublicError("Dort steht schon ein Detektiv.");
    state.positions[piece] = action.station;
    if (state.positions[state.mrX] === action.station) {
      caught(state, piece);
      return state;
    }
    state.picker += 1;
    if (state.picker >= state.detectives.length) {
      state.phase = "mrx";
      state.banner = "Mr. X setzt sich in Bewegung.";
    } else state.banner = `${nameOf(state, state.detectives[state.picker]!)} wählt einen Start.`;
    return state;
  }

  if (action.type === "sy-move") {
    if (state.phase !== "mrx" && state.phase !== "det") throw new PublicError("Gerade wird nicht gefahren.");
    if (state.phase === "det" && action.doubleTo != null) throw new PublicError("Detektive haben keinen Doppelzug.");
    const match = scotlandMoves(state, piece).find(
      (move) =>
        move.to === action.to &&
        move.ticket === action.ticket &&
        (move.doubleTo ?? null) === (action.doubleTo ?? null) &&
        (move.doubleTicket ?? null) === (action.doubleTicket ?? null),
    );
    if (!match) throw new PublicError("Diese Fahrt geht nicht.");
    const mine = state.tickets[piece]!;
    const from = state.positions[piece];
    if (from == null) throw new PublicError("Diese Fahrt geht nicht.");
    const hop = hopWords(state.city, from, match.to, match.ticket);
    mine[match.ticket] -= 1;
    if (state.phase === "det") {
      handOver(state, match.ticket);
      state.positions[piece] = match.to;
      pushLog(state.log, `${nameOf(state, piece)} fährt mit ${hop.mit} nach ${match.to}.`);
      if (state.positions[state.mrX] === match.to) {
        caught(state, piece);
        return state;
      }
      state.picker += 1;
      if (state.picker >= state.detectives.length) finishDetectives(state);
      else skipStuck(state);
      return state;
    }
    state.moves.push({ round: state.round, ticket: match.ticket, station: match.to });
    note(state, state.round, hop.nimmt, match.to);
    state.positions[state.mrX] = match.to;
    const firstSpotter = state.detectives.find((id) => state.positions[id] === match.to);
    if (firstSpotter) {
      caught(state, firstSpotter);
      return state;
    }
    if (match.doubleTo != null && match.doubleTicket) {
      mine.double -= 1;
      mine[match.doubleTicket] -= 1;
      state.round += 1;
      const secondHop = hopWords(state.city, match.to, match.doubleTo, match.doubleTicket);
      state.moves.push({ round: state.round, ticket: match.doubleTicket, station: match.doubleTo });
      note(state, state.round, secondHop.nimmt, match.doubleTo);
      state.positions[state.mrX] = match.doubleTo;
      const secondSpotter = state.detectives.find((id) => state.positions[id] === match.doubleTo);
      if (secondSpotter) {
        caught(state, secondSpotter);
        return state;
      }
    }
    beginDetectives(state);
    return state;
  }

  throw new PublicError("Das geht in Scotland Yard gerade nicht.");
}

export function viewScotland(state: ScotlandState, userId: string): ScotlandView {
  if (state.city !== "london" && state.city !== "paris" && state.city !== "barcelona") state.city = "london";
  const youAreMrX = userId === state.mrX;
  const piece = actor(state);
  const youAreUp = piece != null && ownerOf(state, piece) === userId;
  const yours = youAreMrX ? state.mrX : state.detectives.find((id) => ownerOf(state, id) === userId) ?? null;
  const focus = youAreUp && piece ? piece : yours;
  const latest = state.moves[state.moves.length - 1];
  const visibleNow = youAreMrX || (latest != null && state.reveals.includes(latest.round) && state.phase !== "mrx");
  const lastReveal = [...state.moves].reverse().find((move) => state.reveals.includes(move.round));
  const moves = youAreUp && piece && (state.phase === "mrx" || state.phase === "det") ? scotlandMoves(state, piece) : [];
  const choices =
    youAreUp && piece && (state.phase === "mrx-start" || state.phase === "det-start")
      ? cityMap(state.city).starts.filter((id) => state.phase === "mrx-start" || !occupiedByDetective(state, id, piece))
      : null;
  return {
    kind: "scotland",
    phase: state.phase,
    youAreUp,
    youAreMrX,
    city: state.city,
    mrXId: state.mrX,
    round: state.round,
    maxRounds: state.maxRounds,
    reveals: state.reveals,
    turnId: piece,
    positions: [
      {
        id: state.mrX,
        name: nameOf(state, state.mrX),
        role: "mrx" as const,
        station: visibleNow ? state.positions[state.mrX] ?? null : null,
      },
      ...state.detectives.map((id) => ({
        id,
        name: nameOf(state, id),
        role: "det" as const,
        station: state.positions[id] ?? null,
      })),
    ],
    tickets: { ...(state.tickets[focus ?? ""] ?? bag(youAreMrX ? "mrx" : "det")) },
    travel: state.moves.map((move) => ({
      round: move.round,
      ticket: move.ticket,
      station: youAreMrX || state.reveals.includes(move.round) ? move.station : null,
    })),
    lastSeen: lastReveal ? { round: lastReveal.round, station: lastReveal.station } : null,
    choices,
    home: focus ? state.positions[focus] ?? null : null,
    moves: state.phase === "det" ? moves.filter((move) => move.doubleTo == null) : moves,
    specials: {
      black: state.tickets[state.mrX]?.black ?? 0,
      double: state.tickets[state.mrX]?.double ?? 0,
      heli: 0,
    },
    meetHits: 0,
    meetings: null,
    sights: [],
    masts: [],
    probeReady: false,
    probe: null,
    banner: state.banner,
    log: state.log,
    winnerIds: state.winnerIds,
    caughtBy: state.caughtBy,
  };
}
