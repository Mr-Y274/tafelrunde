import { PublicError } from "../errors";
import { FLEET } from "./fleet";
import { applyMatch, viewMatch } from "./engine";
import { decoyWord } from "./pictionary";
import { riskoIsSet } from "./risko";
import { riskoConnected, riskoNeighbors } from "./risko-map";
import { PENCILS } from "./sketch";
import type { Action, GameState, HerzCard, Player, ScotlandView, ShipId, StapelView, UnoView, VierView, ZehnView } from "./types";
import { BOT_ID, BOT_NAME } from "./bot-id";

export { BOT_ID, BOT_NAME };

export function withBot(players: Player[]): Player[] {
  return [...players, { id: BOT_ID, name: BOT_NAME }];
}

function tryAction(state: GameState, action: Action, now: number) {
  try {
    applyMatch(structuredClone(state), BOT_ID, action, now);
    return true;
  } catch (error) {
    if (error instanceof PublicError) return false;
    throw error;
  }
}

function combinations<T>(items: T[], count: number): T[][] {
  if (count === 0) return [[]];
  if (items.length < count) return [];
  const [head, ...tail] = items;
  const withHead = combinations(tail, count - 1).map((combo) => [head as T, ...combo]);
  return [...withHead, ...combinations(tail, count)];
}

function discardRank(card: HerzCard) {
  if (card.kind === "skip") return 100;
  if (card.kind === "wild") return -20;
  return card.n ?? 0;
}

function findLay(state: GameState, view: ZehnView) {
  const ids = view.hand.map((card) => card.id);
  const sizes = view.task.groups.map((group) => group.n);
  function search(left: string[], index: number, chosen: string[][]): string[][] | null {
    if (index === sizes.length) {
      const action: Action = { type: "zehn-lay", groups: chosen };
      return tryAction(state, action, 0) ? chosen : null;
    }
    for (const combo of combinations(left, sizes[index] ?? 0)) {
      const used = new Set(combo);
      const found = search(left.filter((id) => !used.has(id)), index + 1, [...chosen, combo]);
      if (found) return found;
    }
    return null;
  }
  return search(ids, 0, []);
}

function pickZehn(state: GameState, view: ZehnView): Action | null {
  if (view.phase === "draw") {
    const fromDiscard = view.discard && view.discard.kind !== "skip" ? ({ type: "zehn-draw", from: "ablage" } as const) : null;
    if (fromDiscard && tryAction(state, fromDiscard, 0)) return fromDiscard;
    return { type: "zehn-draw", from: "deck" };
  }
  if (view.phase !== "play") return null;
  if (!view.youDown) {
    const groups = findLay(state, view);
    if (groups) return { type: "zehn-lay", groups };
  } else {
    for (const card of view.hand) {
      if (view.hand.length < 2) break;
      for (let group = 0; group < view.laid.length; group++) {
        const edges = view.laid[group]?.kind === "reihe" ? ([undefined, "low", "high"] as const) : ([undefined] as const);
        for (const edge of edges) {
          const action: Action = { type: "zehn-hit", group, id: card.id, edge };
          if (tryAction(state, action, 0)) return action;
        }
      }
    }
  }
  const card = [...view.hand].sort((a, b) => discardRank(b) - discardRank(a))[0];
  return card ? { type: "zehn-discard", id: card.id } : null;
}

function pickStapel(state: GameState, view: StapelView): Action | null {
  if (view.phase !== "play") return null;
  const sources: { from: "hand" | "stock" | "ablage"; id?: string; slot?: number }[] = [];
  if (view.stockTop) sources.push({ from: "stock" });
  for (const card of view.hand) sources.push({ from: "hand", id: card.id });
  view.bins.forEach((bin, slot) => {
    if (bin.count > 0) sources.push({ from: "ablage", slot });
  });
  for (const source of sources) {
    for (let pile = 0; pile < view.piles.length; pile++) {
      const action: Action = { type: "stapel-play", from: source.from, id: source.id, pile, slot: source.slot };
      if (tryAction(state, action, 0)) return action;
    }
  }
  if (view.hand[0]) return { type: "stapel-end", id: view.hand[0].id, slot: 0 };
  return { type: "stapel-end", slot: 0 };
}

function line(cells: (number | null)[], spot: number, cols: number, rows: number) {
  const col = spot % cols;
  const row = Math.floor(spot / cols);
  const player = cells[spot];
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (const [dc, dr] of dirs) {
    let count = 1;
    for (const sign of [-1, 1]) {
      let c = col + dc! * sign;
      let r = row + dr! * sign;
      while (c >= 0 && c < cols && r >= 0 && r < rows && cells[r * cols + c] === player) {
        count += 1;
        c += dc! * sign;
        r += dr! * sign;
      }
    }
    if (count >= 4) return true;
  }
  return false;
}

function drop(cells: (number | null)[], col: number, player: number, cols: number, rows: number) {
  const next = cells.slice();
  for (let row = 0; row < rows; row++) {
    const spot = row * cols + col;
    if (next[spot] == null) {
      next[spot] = player;
      return { cells: next, spot };
    }
  }
  return null;
}

function pickVier(view: VierView): Action {
  const cols = view.cols || 7;
  const rows = view.height || 6;
  const open = Array.from({ length: cols }, (_, col) => col).filter((col) => view.cells[(rows - 1) * cols + col] == null);
  const seats = view.rows.map((_, seat) => seat).filter((seat) => seat !== view.you);
  for (const col of open) {
    const landed = drop(view.cells, col, view.you, cols, rows);
    if (landed && line(landed.cells, landed.spot, cols, rows)) return { type: "vier-drop", col };
  }
  for (const foe of seats) {
    for (const col of open) {
      const landed = drop(view.cells, col, foe, cols, rows);
      if (landed && line(landed.cells, landed.spot, cols, rows)) return { type: "vier-drop", col };
    }
  }
  const mid = Math.floor((cols - 1) / 2);
  const order = Array.from({ length: cols }, (_, col) => col).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
  return { type: "vier-drop", col: order.find((col) => open.includes(col)) ?? open[0] ?? 0 };
}

function fleet(rng: () => number): Action {
  const taken = new Set<string>();
  const ships: { id: ShipId; x: number; y: number; dir: "h" | "v" }[] = [];
  for (const ship of FLEET) {
    for (let attempt = 0; attempt < 300; attempt++) {
      const dir = rng() < 0.5 ? "h" : "v";
      const x = Math.floor(rng() * (dir === "h" ? 11 - ship.len : 10));
      const y = Math.floor(rng() * (dir === "v" ? 11 - ship.len : 10));
      const cells: [number, number][] = [];
      let free = true;
      for (let step = 0; step < ship.len; step++) {
        const cx = x + (dir === "h" ? step : 0);
        const cy = y + (dir === "v" ? step : 0);
        const key = `${cx},${cy}`;
        if (taken.has(key)) free = false;
        cells.push([cx, cy]);
      }
      if (!free) continue;
      for (const [cx, cy] of cells) taken.add(`${cx},${cy}`);
      ships.push({ id: ship.id, x, y, dir });
      break;
    }
  }
  if (ships.length < FLEET.length) {
    return {
      type: "place",
      ships: [
        { id: "schlacht", x: 0, y: 0, dir: "h" },
        { id: "kreuzer", x: 0, y: 2, dir: "h" },
        { id: "zerstorer", x: 0, y: 4, dir: "h" },
        { id: "uboot", x: 0, y: 6, dir: "h" },
        { id: "boot", x: 0, y: 8, dir: "h" },
      ],
    };
  }
  return { type: "place", ships };
}

function riskoSet(hand: { id: string; land: string | null; symbol: string }[]) {
  for (let a = 0; a < hand.length; a++) {
    for (let b = a + 1; b < hand.length; b++) {
      for (let c = b + 1; c < hand.length; c++) {
        const cards = [hand[a]!, hand[b]!, hand[c]!];
        if (riskoIsSet(cards.map((card) => card.symbol))) return cards;
      }
    }
  }
  return null;
}

function pickRisko(state: Extract<GameState, { kind: "risko" }>): Action {
  const me = state.turn;
  if (state.phase === "trade") {
    const cards = riskoSet(state.hands[me] ?? []);
    const owned = (cards ?? []).map((card) => card.land).filter((id): id is string => id != null && state.lands[id]?.owner === me);
    return { type: "risko-trade", ids: (cards ?? []).map((card) => card.id), onto: owned[0] };
  }
  if (state.phase === "occupy" && state.occupy) return { type: "risko-occupy", n: state.occupy.min };
  const mine = Object.entries(state.lands).filter(([, land]) => land.owner === me);
  if (state.phase === "draft" || state.phase === "place") {
    const borders = mine.filter(([id]) => riskoNeighbors(id).some((next) => state.lands[next]?.owner !== me));
    const choice = (borders.length > 0 ? borders : mine).sort((a, b) => a[1].armies - b[1].armies)[0];
    return { type: "risko-place", id: choice?.[0] ?? "alaska" };
  }
  if (state.phase === "attack") {
    for (const [id, land] of mine) {
      if (land.armies < 3) continue;
      const target = riskoNeighbors(id)
        .map((next) => [next, state.lands[next]!] as const)
        .filter(([, other]) => other.owner !== me && land.armies >= other.armies + 2)
        .sort((a, b) => a[1].armies - b[1].armies)[0];
      if (target) return { type: "risko-attack", from: id, to: target[0] };
    }
    return { type: "risko-halt" };
  }
  const owners = Object.fromEntries(Object.entries(state.lands).map(([id, land]) => [id, land.owner]));
  const interior = mine.find(([id, land]) => land.armies > 2 && riskoNeighbors(id).every((next) => state.lands[next]?.owner === me));
  const border = mine.find(([id]) => riskoNeighbors(id).some((next) => state.lands[next]?.owner !== me));
  if (interior && border && interior[0] !== border[0] && riskoConnected(owners, interior[0], border[0])) {
    return { type: "risko-fortify", from: interior[0], to: border[0] };
  }
  return { type: "risko-end" };
}

function shot(state: Extract<GameState, { kind: "schiffe" }>, rng: () => number): Action {
  const shots = state.shots[BOT_ID] ?? [];
  const used = new Set(shots.map((item) => `${item.x},${item.y}`));
  for (const hit of shots.filter((item) => item.hit && !item.sunk)) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = hit.x + dx;
      const y = hit.y + dy;
      if (x < 0 || y < 0 || x > 9 || y > 9 || used.has(`${x},${y}`)) continue;
      return { type: "shoot", x, y };
    }
  }
  const open: [number, number][] = [];
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      if (!used.has(`${x},${y}`) && (x + y) % 2 === 0) open.push([x, y]);
    }
  }
  if (open.length === 0) {
    for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) if (!used.has(`${x},${y}`)) open.push([x, y]);
  }
  const [x, y] = open[Math.floor(rng() * open.length)] ?? [0, 0];
  return { type: "shoot", x, y };
}

function isCrewBot(id: string) {
  return id.startsWith("00000000-0000-4000-8000-");
}

export function withScotlandCrew(players: Player[]): Player[] {
  if (players.length >= 2) return players.slice(0, 6);
  return withBot(players);
}

function botToMove(state: GameState) {
  if (state.phase === "done") return null;
  if (state.kind === "scotland") {
    const piece = state.phase === "mrx" || state.phase === "mrx-start" ? state.mrX : state.phase === "det" || state.phase === "det-start" ? state.detectives[state.picker] ?? null : null;
    const id = piece ? state.controls?.[piece] ?? piece : null;
    return id && isCrewBot(id) ? id : null;
  }
  return state.players.some((player) => player.id === BOT_ID) ? BOT_ID : null;
}

function pickScotland(view: ScotlandView): Action | null {
  if (view.choices && view.choices.length > 0) return { type: "sy-start", station: view.choices[0]! };
  const blocked = new Set(view.positions.filter((player) => player.role === "det" && player.station != null).map((player) => player.station));
  const meetings = new Set((view.meetings ?? []).filter((meet) => !meet.hit).map((meet) => meet.station));
  const plain = view.moves.filter((move) => move.doubleTo == null);
  const safe = plain.filter((move) => !blocked.has(move.to));
  const pool = safe.length > 0 ? safe : plain.length > 0 ? plain : view.moves;
  const aimed = pool.find((move) => meetings.has(move.to) || meetings.has(move.doubleTo ?? -1));
  const order = { taxi: 0, bus: 1, ug: 2, black: 3, heli: 4 };
  const ranked = [...pool].sort((a, b) => order[a.ticket] - order[b.ticket]);
  const move = aimed ?? ranked[0];
  if (!move) return null;
  return { type: "sy-move", to: move.to, ticket: move.ticket, doubleTo: move.doubleTo, doubleTicket: move.doubleTicket };
}

function pickUno(view: UnoView): Action {
  if (view.canCatch) return { type: "uno-catch" };
  if (view.phase === "opening-color") return { type: "uno-color", color: "rot" };
  if (view.phase === "challenge") return { type: "uno-challenge", challenge: false };
  if (view.phase === "penalty") {
    const stack = view.legalIds[0];
    if (stack) return { type: "uno-play", id: stack, uno: view.hand.length === 2 };
    return { type: "uno-draw" };
  }
  const id = view.legalIds.find((cardId) => view.hand.find((card) => card.id === cardId)?.value !== "wild4") ?? view.legalIds[0];
  if (view.phase === "drawn") {
    if (!id) return { type: "uno-pass" };
  } else if (!id) return { type: "uno-draw" };
  const card = view.hand.find((item) => item.id === id);
  return { type: "uno-play", id: id!, color: card && !card.color ? "rot" : undefined, uno: view.hand.length === 2 };
}

function doodle(seed: number, index: number): Action {
  const x = 160 + (seed % 7) * 30;
  const y = 180 + index * 90;
  const points: [number, number][] = [];
  for (let step = 0; step <= 10; step++) points.push([x + step * 24, y + Math.round(Math.sin((step + seed) / 2) * 40)]);
  return { type: "stroke", color: PENCILS[index % PENCILS.length]!, size: 16, points };
}

function botAction(state: GameState, now: number, rng: () => number, actorId = BOT_ID): Action | null {
  if (state.phase === "done") return null;
  if (state.kind === "scotland") {
    const view = viewMatch(state, actorId);
    if (view.kind !== "scotland" || !view.youAreUp) return null;
    return pickScotland(view);
  }
  if (!state.players.some((player) => player.id === BOT_ID)) return null;
  if (state.kind === "pictionary") {
    if (state.phase !== "draw") return null;
    const drawer = state.players[state.drawer % state.players.length];
    if (drawer?.id === BOT_ID) {
      if (state.strokes.length >= 4) return null;
      return doodle(state.word.length + state.board, state.strokes.length);
    }
    const mine = state.guesses.filter((guess) => guess.name === BOT_NAME);
    if (mine.length >= 3) return null;
    const opened = state.turnEndsAt - 70_000;
    if (now < opened + 8_000 * (mine.length + 1)) return null;
    if (mine.length === 2) return { type: "guess", text: state.word };
    return { type: "guess", text: decoyWord(state.category, state.word, mine.map((guess) => guess.text), rng) };
  }
  if (state.kind === "schiffe") {
    const view = viewMatch(state, BOT_ID);
    if (view.kind !== "schiffe" || !view.youAreUp) return null;
    if (state.phase === "placement") return fleet(rng);
    return shot(state, rng);
  }
  const view = viewMatch(state, BOT_ID);
  if (view.kind === "uno" && view.canCatch) return { type: "uno-catch" };
  if (!("youAreUp" in view) || !view.youAreUp) return null;
  if (view.kind === "wizard") {
    if (view.phase === "trump") return { type: "trump", suit: view.blatt === "skat" ? "kreuz" : "rot" };
    if (view.phase === "bid") {
      const strong = view.hand.filter((card) => card.t === "W" || (card.t === "n" && card.rank >= 12)).length;
      return { type: "bid", n: Math.min(view.cardsThisRound, strong) };
    }
    const id = view.legalIds.find((cardId) => view.hand.find((card) => card.id === cardId)?.t !== "W") ?? view.legalIds[0];
    return id ? { type: "card", id } : null;
  }
  if (view.kind === "uno") return pickUno(view);
  if (view.kind === "scotland") return pickScotland(view);
  if (view.kind === "zehn") return pickZehn(state, view);
  if (view.kind === "stapel") return pickStapel(state, view);
  if (view.kind === "memo") {
    if (view.phase === "show") return { type: "memo-hide" };
    if (state.kind !== "memo" || view.phase !== "flip") return null;
    const open = state.open[0];
    if (open != null) {
      const animal = state.tiles[open]?.animal;
      const match = state.tiles.findIndex((tile, index) => index !== open && tile.owner == null && !tile.up && tile.animal === animal);
      if (match >= 0) return { type: "memo-flip", index: match };
    } else {
      const waiting = new Map<string, number>();
      for (let index = 0; index < state.tiles.length; index++) {
        const tile = state.tiles[index]!;
        if (tile.owner != null || tile.up) continue;
        const first = waiting.get(tile.animal);
        if (first != null) return { type: "memo-flip", index: first };
        waiting.set(tile.animal, index);
      }
    }
    const hidden = state.tiles.map((tile, index) => (tile.owner == null && !tile.up ? index : -1)).filter((index) => index >= 0);
    const index = hidden[Math.floor(rng() * hidden.length)];
    return index == null ? null : { type: "memo-flip", index };
  }
  if (view.kind === "vier") return pickVier(view);
  if (view.kind === "risko" && state.kind === "risko") return pickRisko(state);
  return null;
}

export function settleBot(state: GameState, now = Date.now(), rng: () => number = Math.random): GameState {
  let current = state;
  for (let step = 0; step < 80; step++) {
    if (current.phase === "done") return current;
    const actorId = botToMove(current);
    if (!actorId) return current;
    const action = botAction(current, now, rng, actorId);
    if (!action) return current;
    current = applyMatch(current, actorId, action, now);
  }
  return current;
}
