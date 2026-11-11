import { PublicError } from "../errors";
import { cityLinks, cityMap, type CityId } from "./city-maps";
import type {
  Action,
  Player,
  Ride,
  ScotlandMove,
  ScotlandProbe,
  ScotlandState,
  ScotlandTickets,
  ScotlandView,
  Tempo,
  TravelTicket,
} from "./types";
import { pushLog } from "./util";

const TRAVEL: TravelTicket[] = ["taxi", "bus", "ug", "black"];

function bag(role: "mrx" | "det"): ScotlandTickets {
  return role === "mrx"
    ? { taxi: 4, bus: 3, ug: 3, black: 5, double: 2, heli: 2 }
    : { taxi: 10, bus: 8, ug: 4, black: 0, double: 0, heli: 0 };
}

function ticketLabel(ticket: Ride) {
  if (ticket === "taxi") return "Taxi";
  if (ticket === "bus") return "Bus";
  if (ticket === "ug") return "U-Bahn";
  if (ticket === "heli") return "Hubschrauber";
  return "Schwarz";
}

function taxiSteps(city: CityId, from: number, to: number) {
  if (from === to) return 0;
  const dist = new Map<number, number>([[from, 0]]);
  const queue = [from];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const soFar = dist.get(current)!;
    for (const next of cityLinks(city, current, "taxi")) {
      if (dist.has(next)) continue;
      const value = soFar + 1;
      if (next === to) return value;
      dist.set(next, value);
      queue.push(next);
    }
  }
  return null;
}

function heliTargets(city: CityId, from: number) {
  let best = Number.POSITIVE_INFINITY;
  const found: number[] = [];
  for (const sight of cityMap(city).sights) {
    if (sight.id === from) continue;
    const dist = taxiSteps(city, from, sight.id);
    if (dist == null || dist <= 0) continue;
    if (dist < best) {
      best = dist;
      found.length = 0;
      found.push(sight.id);
    } else if (dist === best) found.push(sight.id);
  }
  return found;
}

function band(dist: number | null): "nah" | "mittel" | "fern" {
  if (dist == null || dist > 8) return "fern";
  if (dist > 4) return "mittel";
  return "nah";
}

export function createScotland(players: Player[], tempo: Tempo, rng: () => number = Math.random, city: CityId = "london"): ScotlandState {
  if (players.length < 2 || players.length > 5) throw new PublicError("Scotland Yard braucht 2 bis 5 Leute.");
  const mrIndex = Math.floor(rng() * players.length);
  const mrX = players[mrIndex]!.id;
  const detectives = players.filter((player) => player.id !== mrX).map((player) => player.id);
  const tickets: Record<string, ScotlandTickets> = {};
  const positions: Record<string, number | null> = {};
  const map = cityMap(city);
  const opening = map.opening[tempo];
  for (const player of players) {
    tickets[player.id] = bag(player.id === mrX ? "mrx" : "det");
    positions[player.id] = null;
  }
  positions[mrX] = opening[0]!;
  detectives.forEach((id, index) => {
    positions[id] = opening[index + 1]!;
  });
  const hard = tempo === "kurz";
  const banner = hard
    ? `${players[mrIndex]!.name} ist Mr. X in ${map.name}. Kurze Jagd, schwer für ihn: er startet in der Mitte, die Detektive stehen nah.`
    : `${players[mrIndex]!.name} ist Mr. X in ${map.name}. Lange Jagd, leichter für ihn: er startet am Rand, die Detektive stehen weit weg.`;
  return {
    kind: "scotland",
    players,
    mrX,
    detectives,
    positions,
    tickets,
    city,
    round: 1,
    maxRounds: hard ? 13 : 22,
    reveals: hard ? [3, 8, 13] : [3, 8, 13, 18, 22],
    phase: "mrx",
    picker: 0,
    moves: [],
    meetings: pickMeetings(map.meetPool, rng),
    meetHits: [],
    probed: false,
    probe: null,
    banner,
    log: [banner, ...detectives.map((id) => `${players.find((player) => player.id === id)?.name ?? "Jemand"} startet bei ${positions[id]}.`)],
  };
}

function pickMeetings(poolSource: number[], rng: () => number) {
  const pool = [...poolSource];
  const picked: number[] = [];
  while (picked.length < 5 && pool.length > 0) {
    const index = Math.floor(rng() * pool.length);
    picked.push(pool.splice(index, 1)[0]!);
  }
  return picked;
}

function shownCount(state: ScotlandState) {
  const span = Math.max(1, state.maxRounds - 1);
  return Math.min(state.meetings.length, 1 + Math.floor(((state.round - 1) * (state.meetings.length - 1)) / span));
}

function destinations(city: CityId, from: number, ticket: TravelTicket) {
  if (ticket === "black") {
    const found = new Set<number>();
    for (const mode of ["taxi", "bus", "ug", "water"] as const) for (const next of cityLinks(city, from, mode)) found.add(next);
    return [...found];
  }
  return cityLinks(city, from, ticket);
}

function stepsFrom(city: CityId, tickets: ScotlandTickets, from: number) {
  const found: { to: number; ticket: TravelTicket }[] = [];
  for (const ticket of TRAVEL) {
    if ((tickets[ticket] ?? 0) <= 0) continue;
    for (const to of destinations(city, from, ticket)) found.push({ to, ticket });
  }
  return found;
}

export function scotlandMoves(state: ScotlandState, userId: string): ScotlandMove[] {
  const from = state.positions[userId];
  if (from == null) return [];
  const mine = state.tickets[userId];
  if (!mine) return [];
  const singles = stepsFrom(state.city, mine, from).map((step) => ({ to: step.to, ticket: step.ticket }));
  const flight: ScotlandMove[] = userId === state.mrX && (mine.heli ?? 0) > 0 ? heliTargets(state.city, from).map((to) => ({ to, ticket: "heli" as const })) : [];
  if (userId !== state.mrX || mine.double <= 0 || state.round >= state.maxRounds) return [...singles, ...flight];
  const doubles: ScotlandMove[] = [];
  for (const first of singles) {
    const left: ScotlandTickets = { ...mine, [first.ticket]: mine[first.ticket] - 1 };
    for (const second of stepsFrom(state.city, left, first.to)) {
      doubles.push({ to: first.to, ticket: first.ticket, doubleTo: second.to, doubleTicket: second.ticket });
    }
  }
  return [...singles, ...flight, ...doubles];
}

function actor(state: ScotlandState) {
  if (state.phase === "done") return null;
  if (state.phase === "mrx-start" || state.phase === "mrx") return state.mrX;
  return state.detectives[state.picker] ?? null;
}

function nameOf(state: ScotlandState, id: string) {
  return state.players.find((player) => player.id === id)?.name ?? "Jemand";
}

function caught(state: ScotlandState, by: string) {
  state.phase = "done";
  state.caughtBy = by;
  state.winnerIds = state.detectives.slice();
  state.banner = `${nameOf(state, by)} fasst Mr. X.`;
  pushLog(state.log, state.banner);
}

function beginDetectives(state: ScotlandState) {
  state.phase = "det";
  state.picker = 0;
  state.probed = false;
  state.probe = null;
  skipStuck(state);
}

function reachMeeting(state: ScotlandState, station: number) {
  const shown = new Set(state.meetings.slice(0, shownCount(state)));
  if (!shown.has(station) || state.meetHits.includes(station)) return false;
  state.meetHits.push(station);
  pushLog(state.log, state.meetHits.length >= 2 ? "Mr. X hat den zweiten Treffpunkt erreicht." : "Mr. X hat einen Treffpunkt erreicht.");
  if (state.meetHits.length >= 2) {
    mrXWins(state, "Mr. X hat zwei Treffpunkte erreicht.");
    return true;
  }
  return false;
}

function mrXWins(state: ScotlandState, banner: string) {
  state.phase = "done";
  state.winnerIds = [state.mrX];
  state.banner = banner;
  pushLog(state.log, state.banner);
}

function finishDetectives(state: ScotlandState) {
  if (state.round >= state.maxRounds) {
    if (state.meetHits.length >= 1) mrXWins(state, "Mr. X erreicht einen Treffpunkt und entkommt.");
    else {
      state.phase = "done";
      state.winnerIds = state.detectives.slice();
      state.banner = "Mr. X hat keinen Treffpunkt erreicht.";
      pushLog(state.log, state.banner);
    }
    return;
  }
  state.round += 1;
  state.phase = "mrx";
  if (scotlandMoves(state, state.mrX).length === 0) {
    state.phase = "done";
    state.winnerIds = state.detectives.slice();
    state.banner = "Mr. X sitzt fest.";
    pushLog(state.log, state.banner);
    return;
  }
  state.banner = "Mr. X ist unterwegs.";
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
    pushLog(state.log, `${nameOf(state, id)} kommt nicht weiter.`);
    state.picker += 1;
    guard += 1;
    if (state.picker >= state.detectives.length) {
      finishDetectives(state);
      return;
    }
  }
}

function possibleStations(state: ScotlandState) {
  let possible = new Set<number>(cityMap(state.city).stations.map((spot) => spot.id));
  for (const move of state.moves) {
    if (state.reveals.includes(move.round)) {
      possible = new Set([move.station]);
      continue;
    }
    const next = new Set<number>();
    for (const from of possible) {
      const hops = move.ticket === "heli" ? heliTargets(state.city, from) : destinations(state.city, from, move.ticket);
      for (const hop of hops) next.add(hop);
    }
    possible = next;
  }
  return [...possible].sort((a, b) => a - b);
}

function investigate(state: ScotlandState, kind: ScotlandProbe["kind"]): ScotlandProbe {
  const here = state.positions[state.mrX];
  if (kind === "analyse") return { kind, stations: possibleStations(state) };
  if (kind === "ortung") {
    return {
      kind,
      masts: cityMap(state.city).masts.map((mast) => ({
        id: mast.id,
        name: mast.name,
        band: band(here == null ? null : taxiSteps(state.city, here, mast.id)),
      })),
    };
  }
  if (kind === "abtasten") {
    const steps = cityMap(state.city).masts.reduce((best, mast) => {
      const dist = here == null ? null : taxiSteps(state.city, here, mast.id);
      return dist == null ? best : Math.min(best, dist);
    }, Number.POSITIVE_INFINITY);
    return { kind, steps: Number.isFinite(steps) ? steps : 0 };
  }
  const recent = state.moves.slice(-3).map((move) => move.station);
  return {
    kind: "befragung",
    witnesses: cityMap(state.city).sights.map((sight) => ({
      id: sight.id,
      name: sight.name,
      saw: here === sight.id ? "hier" : recent.includes(sight.id) ? "vor kurzem" : "still",
    })),
  };
}

function note(state: ScotlandState, round: number, ticket: Ride, at: number) {
  if (state.reveals.includes(round)) {
    pushLog(state.log, `Runde ${round}: Mr. X taucht bei ${at} auf, ${ticketLabel(ticket)}.`);
  } else {
    pushLog(state.log, `Runde ${round}: Mr. X nimmt das ${ticketLabel(ticket)}.`);
  }
}

export function applyScotland(state: ScotlandState, userId: string, action: Action): ScotlandState {
  if (state.city !== "london" && state.city !== "paris" && state.city !== "barcelona") state.city = "london";
  if (state.phase === "done") throw new PublicError("Die Jagd ist vorbei.");
  const current = actor(state);
  if (current !== userId) throw new PublicError("Du bist nicht dran.");

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
    const occupied = state.detectives.some((id) => state.positions[id] === action.station);
    if (occupied) throw new PublicError("Dort steht schon ein Detektiv.");
    if (state.positions[state.mrX] === action.station) {
      state.positions[userId] = action.station;
      caught(state, userId);
      return state;
    }
    state.positions[userId] = action.station;
    state.picker += 1;
    if (state.picker >= state.detectives.length) {
      state.phase = "mrx";
      state.banner = "Mr. X setzt sich in Bewegung.";
    } else {
      state.banner = `${nameOf(state, state.detectives[state.picker]!)} wählt einen Start.`;
    }
    return state;
  }

  if (action.type === "sy-move") {
    if (state.phase !== "mrx" && state.phase !== "det") throw new PublicError("Gerade wird nicht gefahren.");
    if (state.phase === "det" && action.doubleTo != null) throw new PublicError("Detektive haben keinen Doppelzug.");
    const match = scotlandMoves(state, userId).find(
      (move) =>
        move.to === action.to &&
        move.ticket === action.ticket &&
        (move.doubleTo ?? null) === (action.doubleTo ?? null) &&
        (move.doubleTicket ?? null) === (action.doubleTicket ?? null),
    );
    if (!match) throw new PublicError("Diese Fahrt geht nicht.");
    const mine = state.tickets[userId]!;
    mine[match.ticket] -= 1;
    if (state.phase === "det") {
      state.positions[userId] = match.to;
      pushLog(state.log, `${nameOf(state, userId)} fährt mit dem ${ticketLabel(match.ticket)} nach ${match.to}.`);
      if (state.positions[state.mrX] === match.to) {
        caught(state, userId);
        return state;
      }
      state.picker += 1;
      if (state.picker >= state.detectives.length) finishDetectives(state);
      else skipStuck(state);
      return state;
    }
    state.moves.push({ round: state.round, ticket: match.ticket, station: match.to });
    note(state, state.round, match.ticket, match.to);
    state.positions[state.mrX] = match.to;
    if (reachMeeting(state, match.to)) return state;
    const firstSpotter = state.detectives.find((id) => state.positions[id] === match.to);
    if (firstSpotter) {
      caught(state, firstSpotter);
      return state;
    }
    if (match.doubleTo != null && match.doubleTicket) {
      mine.double -= 1;
      mine[match.doubleTicket] -= 1;
      state.round += 1;
      state.moves.push({ round: state.round, ticket: match.doubleTicket, station: match.doubleTo });
      note(state, state.round, match.doubleTicket, match.doubleTo);
      state.positions[state.mrX] = match.doubleTo;
      if (reachMeeting(state, match.doubleTo)) return state;
      const secondSpotter = state.detectives.find((id) => state.positions[id] === match.doubleTo);
      if (secondSpotter) {
        caught(state, secondSpotter);
        return state;
      }
    }
    beginDetectives(state);
    return state;
  }

  if (action.type === "sy-probe") {
    if (state.phase !== "det") throw new PublicError("Ermittelt wird im Zug der Detektive.");
    if (!state.detectives.includes(userId)) throw new PublicError("Nur die Detektive ermitteln.");
    if (state.probed) throw new PublicError("Diese Runde wurde schon ermittelt.");
    state.probed = true;
    state.probe = investigate(state, action.kind);
    const title = action.kind === "analyse" ? "Analyse" : action.kind === "ortung" ? "Ortung" : action.kind === "abtasten" ? "Abtasten" : "Befragung";
    state.banner = `Die Detektive nutzen die ${title}.`;
    pushLog(state.log, state.banner);
    return state;
  }

  throw new PublicError("Das geht in Scotland Yard gerade nicht.");
}

export function viewScotland(state: ScotlandState, userId: string): ScotlandView {
  if (state.city !== "london" && state.city !== "paris" && state.city !== "barcelona") state.city = "london";
  const youAreMrX = userId === state.mrX;
  const current = actor(state);
  const latest = state.moves[state.moves.length - 1];
  const visibleNow = youAreMrX || (latest != null && state.reveals.includes(latest.round));
  const lastReveal = [...state.moves].reverse().find((move) => state.reveals.includes(move.round));
  const moves = current === userId && (state.phase === "mrx" || state.phase === "det") ? scotlandMoves(state, userId) : [];
  const choices =
    current === userId && (state.phase === "mrx-start" || state.phase === "det-start")
      ? cityMap(state.city).starts.filter((id) => {
          if (state.phase === "mrx-start") return true;
          return !state.detectives.some((detective) => state.positions[detective] === id);
        })
      : null;
  return {
    kind: "scotland",
    phase: state.phase,
    youAreUp: current === userId,
    youAreMrX,
    city: state.city,
    mrXId: state.mrX,
    round: state.round,
    maxRounds: state.maxRounds,
    reveals: state.reveals,
    turnId: current,
    positions: state.players.map((player) => ({
      id: player.id,
      name: player.name,
      role: player.id === state.mrX ? "mrx" : "det",
      station:
        player.id === state.mrX
          ? visibleNow
            ? state.positions[player.id]
            : null
          : state.positions[player.id],
    })),
    tickets: { ...(state.tickets[userId] ?? bag("det")) },
    travel: state.moves.map((move) => ({
      round: move.round,
      ticket: move.ticket,
      station: youAreMrX || state.reveals.includes(move.round) ? move.station : null,
    })),
    lastSeen: lastReveal ? { round: lastReveal.round, station: lastReveal.station } : null,
    choices,
    home: state.positions[userId] ?? null,
    moves: state.phase === "det" ? moves.filter((move) => move.doubleTo == null) : moves,
    specials: {
      black: state.tickets[state.mrX]?.black ?? 0,
      double: state.tickets[state.mrX]?.double ?? 0,
      heli: state.tickets[state.mrX]?.heli ?? 0,
    },
    meetHits: state.meetHits.length,
    meetings: youAreMrX ? state.meetings.slice(0, shownCount(state)).map((station) => ({ station, hit: state.meetHits.includes(station) })) : null,
    sights: cityMap(state.city).sights.map((sight) => ({ id: sight.id, name: sight.name })),
    masts: cityMap(state.city).masts.map((mast) => ({ id: mast.id, name: mast.name })),
    probeReady: state.phase === "det" && current === userId && !state.probed,
    probe: youAreMrX ? null : state.probe,
    banner: state.banner,
    log: state.log,
    winnerIds: state.winnerIds,
    caughtBy: state.caughtBy,
  };
}
