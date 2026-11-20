import { cityConnected, cityLinks, cityMap } from "../lib/games/city-maps";
import { createSchiffe, applySchiffe } from "../lib/games/schiffe";
import { applyWizard, createWizard, wizardCanPlay, wizardTrickWinner } from "../lib/games/wizard";
import { applyUno, createUno, unoCardCount } from "../lib/games/uno";
import { applyScotland, createScotland, scotlandMoves, viewScotland } from "../lib/games/scotland";
import { applyPictionary, createPictionary, normalizeGuess, viewPictionary } from "../lib/games/pictionary";
import { applyMemo, createMemo, viewMemo } from "../lib/games/memo";
import { applyStapel, createStapel, stapelFits, viewStapel } from "../lib/games/stapel";
import { applyRisko, createRisko, RISKO_MISSIONS, riskoIsSet } from "../lib/games/risko";
import { RISKO_LANDS, RISKO_REALMS, RISKO_SEA, riskoNeighbors, tradeValue } from "../lib/games/risko-map";
import { applyVier, createVier } from "../lib/games/vier";
import { applyZehn, createZehn, zehnCardCount } from "../lib/games/zehn";
import type { HerzCard, Player, RiskoState, ScotlandState, UnoState, WCard, WizardState } from "../lib/games/types";
import { BOT_ID, BOT_NAME } from "../lib/games/bot-id";
import { settleBot } from "../lib/games/bot";
import { FLEET } from "../lib/games/fleet";

let failed = 0;

function check(name: string, cond: boolean) {
  if (!cond) {
    failed += 1;
    console.error("FAIL", name);
  } else {
    console.log("ok", name);
  }
}

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const people = (n: number): Player[] => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `Person ${i + 1}` }));

function wizardCards() {
  const lead: WCard = { id: "l", t: "n", suit: "rot", rank: 5 };
  const higher: WCard = { id: "h", t: "n", suit: "rot", rank: 12 };
  const trump: WCard = { id: "t", t: "n", suit: "blau", rank: 2 };
  const wizard: WCard = { id: "w", t: "W" };
  const jester: WCard = { id: "j", t: "J" };
  check(
    "erster Zauberer sticht",
    wizardTrickWinner(
      [
        { player: 0, card: lead },
        { player: 1, card: wizard },
        { player: 2, card: higher },
      ],
      "gelb",
    ) === 1,
  );
  check(
    "Trumpf sticht Farbe",
    wizardTrickWinner(
      [
        { player: 0, card: higher },
        { player: 1, card: trump },
      ],
      "blau",
    ) === 1,
  );
  check(
    "nur Narren: der erste",
    wizardTrickWinner(
      [
        { player: 0, card: jester },
        { player: 1, card: { id: "j2", t: "J" } },
      ],
      null,
    ) === 0,
  );
  const hand: WCard[] = [lead, { id: "g", t: "n", suit: "gelb", rank: 3 }, wizard];
  check("bedienen ist Pflicht", wizardCanPlay(hand, hand[1]!, [{ card: { id: "x", t: "n", suit: "rot", rank: 1 } }]) === false);
  check("Zauberer darf trotzdem", wizardCanPlay(hand, wizard, [{ card: { id: "x", t: "n", suit: "rot", rank: 1 } }]));
}

function playWizard() {
  let state = createWizard(people(3), "kurz", rng(3));
  let guard = 0;
  while (state.phase !== "done" && guard < 4000) {
    guard += 1;
    const id = state.players[state.turn]!.id;
    if (state.phase === "trump") state = applyWizard(state, id, { type: "trump", suit: "gruen" });
    else if (state.phase === "bid") state = applyWizard(state, id, { type: "bid", n: 0 });
    else if (state.phase === "play") {
      const hand = state.hands[id] ?? [];
      const card = hand.find((item) => wizardCanPlay(hand, item, state.trick));
      if (!card) throw new Error("keine legale Karte");
      state = applyWizard(state, id, { type: "card", id: card.id });
    } else break;
  }
  check("Wizard endet", state.phase === "done" && (state.winnerIds?.length ?? 0) > 0);
  const pair = createWizard(people(2), "kurz", rng(8));
  check("Wizard zu zweit hat sechs kurze Runden", pair.maxRounds === 6 && pair.players.length === 2);
  check("Wizard zu zweit hat dreißig volle Runden", createWizard(people(2), "voll", rng(8)).maxRounds === 30);
  const skat = createWizard(people(2), "voll", rng(8), "skat");
  const skatRanks = Object.values(skat.hands).flat().filter((card) => card.t === "n").map((card) => card.rank);
  const skatSuits = new Set(Object.values(skat.hands).flat().flatMap((card) => (card.t === "n" ? [card.suit] : [])));
  check("das Skatblatt hat 20 volle Runden", skat.maxRounds === 20 && skat.blatt === "skat" && skatRanks.every((rank) => rank >= 7 && rank <= 14) && [...skatSuits].every((suit) => suit === "kreuz" || suit === "pik" || suit === "herz" || suit === "karo"));
  let duo = pair;
  let steps = 0;
  while (duo.phase !== "done" && steps < 4000) {
    steps += 1;
    const id = duo.players[duo.turn]!.id;
    if (duo.phase === "trump") duo = applyWizard(duo, id, { type: "trump", suit: "blau" });
    else if (duo.phase === "bid") duo = applyWizard(duo, id, { type: "bid", n: 0 });
    else if (duo.phase === "play") {
      const hand = duo.hands[id] ?? [];
      const card = hand.find((item) => wizardCanPlay(hand, item, duo.trick));
      if (!card) throw new Error("keine legale Karte zu zweit");
      duo = applyWizard(duo, id, { type: "card", id: card.id });
    } else break;
  }
  check("Wizard zu zweit endet", duo.phase === "done");
}

function placeFleet(anchorX: number) {
  return FLEET.map((ship, index) => ({
    id: ship.id,
    x: anchorX,
    y: index,
    dir: "h" as const,
  }));
}

function playSchiffe() {
  let state = createSchiffe(people(2), "voll", () => 0);
  let threw = false;
  try {
    applySchiffe(structuredClone(state), "p0", {
      type: "place",
      ships: [
        { id: "schlacht", x: 0, y: 0, dir: "h" },
        { id: "kreuzer", x: 0, y: 0, dir: "h" },
        { id: "zerstorer", x: 0, y: 1, dir: "h" },
        { id: "uboot", x: 0, y: 2, dir: "h" },
        { id: "boot", x: 0, y: 3, dir: "h" },
      ],
    });
  } catch {
    threw = true;
  }
  check("überlappende Schiffe", threw);
  state = applySchiffe(state, "p0", { type: "place", ships: placeFleet(0) });
  state = applySchiffe(state, "p1", { type: "place", ships: placeFleet(5) });
  check("Gefecht beginnt", state.phase === "battle");
  let guard = 0;
  while (state.phase === "battle" && guard < 200) {
    guard += 1;
    const id = state.turn!;
    const foe = state.players.find((player) => player.id !== id)!;
    const shots = state.shots[id] ?? [];
    const cell = (state.ships[foe.id] ?? [])
      .flatMap((ship) => ship.cells)
      .find(([x, y]) => !shots.some((shot) => shot.x === x && shot.y === y));
    if (!cell) break;
    state = applySchiffe(state, id, { type: "shoot", x: cell[0], y: cell[1] });
  }
  check("eine Flotte sinkt", state.phase === "done" && state.winnerIds?.length === 1);
}

function playUno() {
  let state = createUno(people(3), "kurz");
  check("Uno-Stapel vollständig", unoCardCount(state) === 108);
  const random = rng(9);
  let guard = 0;
  while (state.phase !== "done" && guard < 250) {
    guard += 1;
    if (unoCardCount(state) !== 108) throw new Error("Uno-Karten verschwinden");
    const id = state.players[state.turn]!.id;
    if (state.phase === "opening-color") state = applyUno(state, id, { type: "uno-color", color: "blau" });
    else if (state.phase === "penalty") state = applyUno(state, id, { type: "uno-draw" });
    else if (state.phase === "challenge") state = applyUno(state, id, { type: "uno-challenge", challenge: random() > 0.7 });
    else if (state.phase === "drawn") {
      const drawn = state.drawnId;
      const top = state.discard.at(-1)!;
      const card = (state.hands[id] ?? []).find((item) => item.id === drawn);
      if (card && (card.color === state.color || card.value === "wild" || card.value === "wild4" || card.value === top.value)) {
        state = applyUno(state, id, {
          type: "uno-play",
          id: card.id,
          color: card.value === "wild" || card.value === "wild4" ? "rot" : undefined,
          uno: true,
        });
      } else state = applyUno(state, id, { type: "uno-pass" });
    } else {
      const hand = state.hands[id] ?? [];
      const top = state.discard.at(-1)!;
      const legal = hand.filter(
        (item) => item.value === "wild" || item.value === "wild4" || item.color === state.color || (top.value !== "wild" && top.value !== "wild4" && item.value === top.value),
      );
      if (legal.length === 0 || random() < 0.25) state = applyUno(state, id, { type: "uno-draw" });
      else {
        const card = legal[Math.floor(random() * legal.length)]!;
        state = applyUno(state, id, {
          type: "uno-play",
          id: card.id,
          color: card.value === "wild" || card.value === "wild4" ? "gelb" : undefined,
          uno: (state.hands[id]?.length ?? 0) === 2,
        });
      }
    }
  }
  check("Uno läuft ohne Abbruch", guard > 10 && unoCardCount(state) === 108);

  const stacked = createUno(people(3), "kurz");
  stacked.phase = "play";
  stacked.pendingDraw = 0;
  stacked.turn = 0;
  stacked.color = "rot";
  stacked.discard = [{ id: "top", color: "gelb", value: "7" }];
  stacked.hands.p0 = [{ id: "d2a", color: "rot", value: "draw2" }, { id: "stay", color: "blau", value: "4" }];
  stacked.hands.p1 = [{ id: "d2b", color: "blau", value: "draw2" }, { id: "five", color: "rot", value: "5" }];
  stacked.hands.p2 = [{ id: "keep", color: "gruen", value: "1" }];
  let pile = applyUno(stacked, "p0", { type: "uno-play", id: "d2a" });
  pile = applyUno(pile, "p1", { type: "uno-play", id: "d2b" });
  check("+2 stapelt sich farbunabhängig", pile.phase === "penalty" && pile.pendingDraw === 4 && pile.turn === 2);
  const before = pile.hands.p2?.length ?? 0;
  pile = applyUno(pile, "p2", { type: "uno-draw" });
  check("danach zieht die nächste Person die Summe", (pile.hands.p2?.length ?? 0) === before + 4);

  const rigged = createUno(people(2), "kurz");
  rigged.target = 1;
  rigged.phase = "play";
  rigged.turn = 0;
  rigged.color = "rot";
  rigged.discard = [{ id: "top", color: "rot", value: "3" }];
  rigged.hands.p0 = [{ id: "last", color: "rot", value: "9" }];
  rigged.hands.p1 = [{ id: "a", color: "blau", value: "1" }];
  const won = applyUno(rigged, "p0", { type: "uno-play", id: "last", uno: false });
  check("letzte Karte gewinnt die Partie", won.phase === "done" && won.winnerIds?.[0] === "p0");
}

function playScotland() {
  const london = cityMap("london");
  const paris = cityMap("paris");
  const barcelona = cityMap("barcelona");
  const counts = (city: typeof london) => {
    const tally = { taxi: 0, bus: 0, ug: 0, water: 0 };
    for (const edge of city.edges) tally[edge.mode] += 1;
    return tally;
  };
  check(
    "drei Städte haben 199 Stationen und dieselbe Balance",
    [london, paris, barcelona].every((city) => {
      const tally = counts(city);
      const ids = new Set(city.stations.map((spot) => spot.id));
      return city.stations.length === 199 && ids.size === 199 && tally.taxi === 346 && tally.bus === 99 && tally.ug === 20 && tally.water === 3 && city.starts.length === 18 && city.radios.length === 4;
    }) && cityConnected("london") && cityConnected("paris") && cityConnected("barcelona"),
  );
  const hunt = createScotland(people(4), "kurz", () => 0, "london");
  const started = [hunt.positions[hunt.mrX], ...hunt.detectives.map((id) => hunt.positions[id])];
  check(
    "vier Personen, 24 Runden, gezogene Startfelder",
    hunt.detectives.length === 3 && hunt.maxRounds === 24 && hunt.reveals.join() === "3,8,13,18,24" && hunt.tickets[hunt.mrX]?.black === 3 && hunt.tickets[hunt.mrX]?.double === 2 && new Set(started).size === 4 && started.every((id) => london.starts.includes(id ?? -1)),
  );
  check("Paris und Barcelona haben eigene Startfelder", createScotland(people(4), "voll", () => 0, "paris").city === "paris" && createScotland(people(4), "kurz", () => 0, "barcelona").city === "barcelona");
  const choosing = createScotland(people(2), "kurz", () => 0);
  choosing.phase = "mrx-start";
  choosing.positions[choosing.mrX] = null;
  const plain = london.stations.find((spot) => !london.starts.includes(spot.id))!;
  let blocked = false;
  try {
    applyScotland(choosing, choosing.mrX, { type: "sy-start", station: plain.id });
  } catch {
    blocked = true;
  }
  check("Start nur auf markierten Feldern", blocked);
  let duo = createScotland(people(2), "kurz", () => 0);
  const water = london.edges.find((edge) => edge.mode === "water")!;
  duo.positions[duo.mrX] = water.a;
  const ferry = scotlandMoves(duo, duo.mrX);
  check(
    "Fähre nur mit Schwarz",
    ferry.some((move) => move.to === water.b && move.ticket === "black") && !ferry.some((move) => move.to === water.b && move.ticket !== "black"),
  );
  const hunter = createScotland(people(2), "kurz", () => 0);
  hunter.phase = "det";
  hunter.picker = 0;
  hunter.positions[hunter.detectives[0]!] = water.a;
  check("Detektiv nimmt keine Fähre", !scotlandMoves(hunter, hunter.detectives[0]!).some((move) => move.to === water.b));
  const hidden = viewScotland(duo, duo.detectives[0]!).positions.find((player) => player.role === "mrx");
  check("Detektiv sieht Mr. X nicht", hidden?.station == null);
  const before = duo.tickets[duo.mrX]!.taxi;
  const detective = duo.detectives[0]!;
  const from = duo.positions[detective]!;
  const hop = cityLinks("london", from, "taxi").find((id) => id !== duo.positions[duo.mrX]);
  if (hop != null) {
    duo.phase = "det";
    duo.picker = 0;
    const paid = applyScotland(duo, detective, { type: "sy-move", to: hop, ticket: "taxi" });
    check("das Detektivticket wandert zu Mr. X", paid.tickets[detective]!.taxi === 9 && paid.tickets[paid.mrX]!.taxi === before + 1);
  } else check("das Detektivticket wandert zu Mr. X", false);
  let reveal = createScotland(people(2), "kurz", rng(2));
  reveal.round = 3;
  const show = scotlandMoves(reveal, reveal.mrX).find((move) => move.doubleTo == null && move.ticket !== "black");
  reveal = applyScotland(reveal, reveal.mrX, { type: "sy-move", to: show!.to, ticket: show!.ticket });
  const book = viewScotland(reveal, reveal.detectives[0]!);
  check("Aufdeckrunde zeigt die Station", book.travel.find((row) => row.round === 3)?.station === show!.to && book.positions.find((player) => player.role === "mrx")?.station === show!.to);
  let quiet = createScotland(people(2), "kurz", rng(3));
  quiet.round = 2;
  const hide = scotlandMoves(quiet, quiet.mrX).find((move) => move.doubleTo == null && move.ticket !== "black");
  quiet = applyScotland(quiet, quiet.mrX, { type: "sy-move", to: hide!.to, ticket: hide!.ticket });
  const secret = viewScotland(quiet, quiet.detectives[0]!);
  check("sonst steht nur das Ticket im Fahrtenbuch", secret.travel.find((row) => row.round === 2)?.station == null && secret.travel.find((row) => row.round === 2)?.ticket === hide!.ticket);
  let blockedSeat = false;
  const crowd = createScotland(people(3), "kurz", () => 0);
  const first = crowd.detectives[0]!;
  const second = crowd.detectives[1]!;
  crowd.phase = "det";
  crowd.picker = 0;
  crowd.positions[second] = cityLinks("london", crowd.positions[first]!, "taxi")[0] ?? crowd.positions[second];
  try {
    applyScotland(crowd, first, { type: "sy-move", to: crowd.positions[second]!, ticket: "taxi" });
  } catch {
    blockedSeat = true;
  }
  check("zwei Detektive stehen nicht auf derselben Station", blockedSeat);
  let stuck = createScotland(people(2), "kurz", () => 0);
  for (const id of stuck.detectives) stuck.tickets[id] = { taxi: 0, bus: 0, ug: 0, black: 0, double: 0, heli: 0 };
  const escape = scotlandMoves(stuck, stuck.mrX).find((move) => move.doubleTo == null);
  stuck = applyScotland(stuck, stuck.mrX, { type: "sy-move", to: escape!.to, ticket: escape!.ticket });
  check("ohne fahrende Detektive gewinnt Mr. X", stuck.phase === "done" && stuck.winnerIds?.[0] === stuck.mrX);
  let late = createScotland(people(2), "kurz", () => 0);
  late.round = 24;
  late.phase = "det";
  late.picker = late.detectives.length - 1;
  const lastPiece = late.detectives[late.picker]!;
  const lastFrom = late.positions[lastPiece]!;
  const lastTo = cityLinks("london", lastFrom, "taxi").find((id) => id !== late.positions[late.mrX] && !late.detectives.some((piece) => late.positions[piece] === id));
  late = applyScotland(late, late.controls[lastPiece]!, { type: "sy-move", to: lastTo!, ticket: "taxi" });
  check("nach Zug 24 entkommt Mr. X", late.phase === "done" && late.winnerIds?.[0] === late.mrX);
  const shared = createScotland(people(2), "kurz", () => 0);
  const player = shared.players.find((person) => person.id !== shared.mrX)!;
  const spare = shared.detectives[1]!;
  shared.phase = "det";
  shared.picker = 1;
  const ride = cityLinks("london", shared.positions[spare]!, "taxi").find((id) => id !== shared.positions[shared.mrX] && !shared.detectives.some((piece) => shared.positions[piece] === id));
  const driven = applyScotland(structuredClone(shared), player.id, { type: "sy-move", to: ride!, ticket: "taxi" });
  let refused = false;
  try {
    applyScotland(structuredClone(shared), shared.mrX, { type: "sy-move", to: ride!, ticket: "taxi" });
  } catch {
    refused = true;
  }
  check(
    "freie Detektive spielt der Detektiv",
    shared.detectives.length === 3 &&
      shared.tickets[shared.mrX]?.black === 3 &&
      shared.detectives.every((id) => shared.controls[id] === player.id) &&
      driven.positions[spare] === ride &&
      refused,
  );
}

function playSketch() {
  check("Umlaute zählen", normalizeGuess("Bär") === normalizeGuess("Baer"));
  let state = createPictionary(people(2), "kurz", rng(2), 1_000);
  const drawer = state.players[state.drawer]!.id;
  const other = state.players.find((player) => player.id !== drawer)!;
  check("Wort bleibt geheim", viewPictionary(state, other.id).word == null && Boolean(viewPictionary(state, drawer).word));
  state = applyPictionary(state, other.id, { type: "guess", text: "irgendwas" }, 1_000);
  check("Fehltipp bleibt stehen", state.guesses.length === 1);
  const word = state.word;
  state = applyPictionary(state, other.id, { type: "guess", text: word }, 2_000);
  check("Treffer gibt beiden Punkte", state.scores[0] === 10 && state.scores[1] === 10);
  check("danach zeichnet die andere Person", state.players[state.drawer]?.id === other.id);
  const leaked = JSON.stringify(viewPictionary(state, state.players[state.drawer]!.id === drawer ? other.id : drawer));
  check("altes Wort ist nicht das neue Geheimnis", !leaked.includes(`"word":"${word}"`) || state.word === word);
  const second = state.word;
  const secondDrawer = state.players[state.drawer]!.id;
  const secondOther = state.players.find((player) => player.id !== secondDrawer)!;
  state = applyPictionary(state, secondOther.id, { type: "guess", text: second }, 3_000);
  check("eine Runde endet nach einem Durchgang", state.phase === "done");

  let full = createPictionary(people(2), "voll", rng(4), 1_000);
  let pictures = 0;
  while (full.phase !== "done" && pictures < 8) {
    const secret = full.word;
    const artist = full.players[full.drawer % full.players.length]!.id;
    const guesser = full.players.find((player) => player.id !== artist)!;
    full = applyPictionary(full, guesser.id, { type: "guess", text: secret }, 4_000 + pictures);
    pictures += 1;
  }
  check("mehrere Runden sind sechs Bilder", pictures === 6 && full.phase === "done");
  check("Punkte laufen über alle Runden", full.scores[0] === 60 && full.scores[1] === 60);
  check("das sechste Bild steht auf dem Blatt", viewPictionary(full, full.players[0]!.id).rounds === 6);

  let skip = createPictionary(people(2), "kurz", rng(5), 1_000);
  const artist = skip.players[0]!.id;
  const mate = skip.players[1]!.id;
  const firstWord = skip.word;
  check("drei Skips am Anfang", viewPictionary(skip, artist).skipsLeft === 3);
  let refused = false;
  try {
    applyPictionary(skip, mate, { type: "skip" }, 1_000);
  } catch {
    refused = true;
  }
  check("nur die zeichnende Person skippt", refused);
  skip = applyPictionary(skip, artist, { type: "skip" }, 5_000);
  check("Skip tauscht das Wort", skip.word !== firstWord && skip.drawer === 0 && skip.skipsLeft === 2);
  check("Skip gibt die Zeit neu", skip.turnEndsAt === 75_000 && skip.strokes.length === 0);
  check("Skip verrät das alte Wort nicht", !JSON.stringify(viewPictionary(skip, mate)).includes(`"word":"${firstWord}"`));
  skip = applyPictionary(skip, artist, { type: "skip" }, 6_000);
  skip = applyPictionary(skip, artist, { type: "skip" }, 7_000);
  check("nach drei Skips ist Schluss", skip.skipsLeft === 0);
  let blocked = false;
  try {
    applyPictionary(skip, artist, { type: "skip" }, 8_000);
  } catch {
    blocked = true;
  }
  check("das vierte Skip geht nicht", blocked);
}

function herz(id: string, n: number, color: HerzCard["color"] = "rot"): HerzCard {
  return { id, kind: "zahl", color, n };
}

function playLove() {
  const zehn = createZehn(people(2), "kurz", rng(8));
  check("Phase 10 hat 108 Karten", zehnCardCount(zehn) === 108);
  zehn.step = "play";
  zehn.hands.p0 = [herz("a", 5), herz("b", 5, "gelb"), herz("c", 5, "gruen"), herz("d", 7), herz("e", 7, "blau"), herz("f", 7, "gelb"), herz("g", 1)];
  let laid = applyZehn(zehn, "p0", { type: "zehn-lay", groups: [["a", "b", "c"], ["d", "e", "f"]] });
  check("zwei Sätze erfüllen die erste Aufgabe", laid.down.p0 === true && laid.laid.length === 2);
  let slept = false;
  try {
    applyZehn(laid, "p0", { type: "zehn-lay", groups: [[{ id: "no" }]] as unknown as string[][] });
  } catch {
    slept = true;
  }
  const sleepy = createZehn(people(2), "kurz", rng(9));
  sleepy.step = "play";
  sleepy.hands.p0 = [{ id: "sch", kind: "skip", color: null, n: null }, herz("keep", 3)];
  const skipped = applyZehn(sleepy, "p0", { type: "zehn-discard", id: "sch" });
  check("Skip lässt die andere Person aussetzen", skipped.turn === 0 && skipped.step === "draw");
  check("eine zweite Aufgabe im selben Zug geht nicht", slept);

  const last = createZehn(people(2), "kurz", rng(10));
  last.goal = 1;
  last.step = "play";
  last.hands.p0 = [herz("a", 4), herz("b", 4, "gruen"), herz("c", 4, "blau"), herz("d", 9), herz("e", 9, "gelb"), herz("f", 9, "gruen"), herz("g", 2)];
  let gone = applyZehn(last, "p0", { type: "zehn-lay", groups: [["a", "b", "c"], ["d", "e", "f"]] });
  gone = applyZehn(gone, "p0", { type: "zehn-discard", id: "g" });
  check("die letzte Aufgabe und leere Hand gewinnen", gone.phase === "done" && gone.winnerIds?.[0] === "p0");

  const kiss = createStapel(people(2), "kurz", rng(11));
  kiss.hands.p0 = [{ id: "kuss", n: null, wild: true }, { id: "drei", n: 3 }, { id: "eins", n: 1 }, { id: "zwei", n: 2 }];
  kiss.piles = [[], [], [], []];
  let built = applyStapel(kiss, "p0", { type: "stapel-play", from: "hand", id: "kuss", pile: 0 });
  check("Skip-Bo wird zur Eins", built.piles[0]?.[0]?.n === 1);
  let refused = false;
  try {
    applyStapel(built, "p0", { type: "stapel-play", from: "hand", id: "drei", pile: 1 });
  } catch {
    refused = true;
  }
  check("eine Drei eröffnet keinen Stapel", refused && stapelFits({ id: "x", n: 3 }, 0) === false);
  built = applyStapel(built, "p0", { type: "stapel-play", from: "hand", id: "zwei", pile: 0 });
  check("danach kommt die Zwei", built.piles[0]?.at(-1)?.n === 2);
  const stockWin = createStapel(people(2), "kurz", rng(12));
  stockWin.stock.p0 = [{ id: "last", n: 1 }];
  stockWin.piles = [[], [], [], []];
  const won = applyStapel(stockWin, "p0", { type: "stapel-play", from: "stock", pile: 0 });
  check("der leere Vorrat gewinnt", won.phase === "done" && won.winnerIds?.[0] === "p0");
  check("der Vorrat hat 10, 20 oder 30 Karten", createStapel(people(2), "kurz", rng(18), 10).stock.p0?.length === 10 && createStapel(people(2), "kurz", rng(18), 20).stock.p0?.length === 20 && createStapel(people(2), "kurz", rng(18), 30).stock.p0?.length === 30);
  const pass = createStapel(people(2), "kurz", rng(13));
  const card = pass.hands.p0?.[0];
  const handed = applyStapel(pass, "p0", { type: "stapel-end", id: card?.id, slot: 0 });
  check("Ablegen gibt weiter und füllt die nächste Hand", handed.turn === 1 && (handed.hands.p1?.length ?? 0) === 5);
  const shown = viewStapel(handed, "p1").others.find((player) => player.id === "p0")?.bins[0];
  check("die Ablage nennt Anzahl und Karten", shown?.count === 1 && shown.cards.length === 1 && shown.cards[0]?.n === card?.n);

  const memo = createMemo(people(2), 6, rng(14));
  check("Memo kennt drei Felder", memo.tiles.length === 12 && createMemo(people(2), 10).tiles.length === 20 && createMemo(people(2), 15).tiles.length === 30);
  const first = memo.tiles.findIndex((tile) => tile.animal === memo.tiles[0]?.animal);
  const second = memo.tiles.findIndex((tile, index) => index !== first && tile.animal === memo.tiles[first]?.animal);
  let found = applyMemo(memo, "p0", { type: "memo-flip", index: first });
  found = applyMemo(found, "p0", { type: "memo-flip", index: second });
  check("ein Paar bleibt und die Person auch", found.scores[0] === 1 && found.turn === 0 && found.phase === "flip");
  const hidden = viewMemo(found, "p1").tiles.filter((tile) => tile.hidden);
  check("verdeckte Tierchen bleiben geheim", hidden.every((tile) => tile.animal == null));
  const left = found.tiles.findIndex((tile) => tile.owner == null);
  const other = found.tiles.findIndex((tile, index) => index !== left && tile.owner == null && tile.animal !== found.tiles[left]?.animal);
  let miss = applyMemo(found, "p0", { type: "memo-flip", index: left });
  miss = applyMemo(miss, "p0", { type: "memo-flip", index: other });
  check("ohne Paar wird erst zugedeckt", miss.phase === "show");
  miss = applyMemo(miss, "p0", { type: "memo-hide" });
  check("danach sucht die nächste Person", miss.turn === 1 && miss.phase === "flip");

  let vier = createVier(people(2));
  for (let n = 0; n < 3; n++) {
    vier = applyVier(vier, "p0", { type: "vier-drop", col: 0 });
    vier = applyVier(vier, "p1", { type: "vier-drop", col: 1 });
  }
  vier = applyVier(vier, "p0", { type: "vier-drop", col: 0 });
  check("vier Herzen in einer Spalte gewinnen", vier.phase === "done" && vier.winnerIds?.[0] === "p0" && vier.win.length >= 4);
  let full = createVier(people(2));
  for (let n = 0; n < 6; n++) full = applyVier(full, n % 2 === 0 ? "p0" : "p1", { type: "vier-drop", col: 2 });
  let blocked = false;
  try {
    applyVier(full, "p0", { type: "vier-drop", col: 2 });
  } catch {
    blocked = true;
  }
  check("eine volle Spalte nimmt kein Herz mehr", blocked);
  check("der letzte Stein bleibt gemerkt", vier.last === 21);
  const klein = createVier(people(4), "klein");
  const gross = createVier(people(4), "gross");
  check("drei Feldgrößen", klein.cells.length === 30 && createVier(people(2)).cells.length === 42 && gross.cells.length === 63 && gross.players.length === 4);
}

function playBot() {
  const human = { id: "human", name: "du" };
  const bot = { id: BOT_ID, name: BOT_NAME };
  const sea = settleBot(createSchiffe([human, bot], "kurz", () => 0));
  check("honeybot legt die Flotte", sea.kind === "schiffe" && sea.ready[BOT_ID] === true && sea.ready.human !== true);
  const answered = settleBot(applyVier(createVier([human, bot]), human.id, { type: "vier-drop", col: 3 }));
  check("honeybot setzt ein Herz", answered.kind === "vier" && answered.cells.some((cell) => cell === 1));
  const quiet = createScotland([bot, human], "kurz", () => 0);
  const moved = settleBot(quiet);
  check("honeybot zieht als Mr. X", moved.kind === "scotland" && moved.positions[BOT_ID] !== quiet.positions[BOT_ID]);
  const memo = settleBot(createMemo([bot, human], 6, () => 0));
  check("honeybot deckt Memo auf", memo.kind === "memo" && memo.tiles.some((tile) => tile.up || tile.owner != null));
  const opened = createRisko([bot, human], "kurz", rng(8));
  const risko = settleBot(opened);
  check("honeybot setzt in Risko", risko.kind === "risko" && risko.turn === 1 && risko.pool[0] === 0 && opened.pool[0]! > 0);
}

function armiesOf(state: RiskoState) {
  return Object.values(state.lands).reduce((sum, land) => sum + land.armies, 0) + state.pool.reduce((sum, n) => sum + n, 0);
}

function stageAttack(players: ReturnType<typeof people>, from: string, to: string, seed: number, own: string[]) {
  const round = createRisko(players, "voll", rng(1));
  round.phase = "attack";
  round.turn = 0;
  round.pool = players.map(() => 0);
  round.seed = seed;
  for (const land of Object.values(round.lands)) {
    land.owner = players.length - 1;
    land.armies = 1;
  }
  for (const id of own) round.lands[id] = { owner: 0, armies: 1 };
  round.lands[from] = { owner: 0, armies: 8 };
  round.lands[to] = { owner: 1, armies: 1 };
  return round;
}

function playRisko() {
  const made = createRisko(people(2), "kurz", rng(3));
  const counts = Object.fromEntries(RISKO_REALMS.map((realm) => [realm.id, RISKO_LANDS.filter((land) => land.realm === realm.id).length]));
  const symbols = { inf: 0, kav: 0, art: 0 };
  for (const land of RISKO_LANDS) if (land.symbol !== "joker") symbols[land.symbol] += 1;
  check(
    "Risko hat 42 Gebiete und sechs Kontinente",
    RISKO_LANDS.length === 42 &&
      counts.nordamerika === 9 &&
      counts.suedamerika === 4 &&
      counts.europa === 7 &&
      counts.afrika === 6 &&
      counts.asien === 12 &&
      counts.australien === 4 &&
      RISKO_REALMS.map((realm) => realm.bonus).join() === "5,2,5,3,7,2" &&
      symbols.inf === 14 &&
      symbols.kav === 14 &&
      symbols.art === 14,
  );
  const seas = [
    ["alaska", "kamtschatka"],
    ["groenland", "island"],
    ["brasilien", "nordafrika"],
    ["westeuropa", "nordafrika"],
    ["suedeuropa", "aegypten"],
    ["suedeuropa", "mittlererosten"],
    ["ostafrika", "mittlererosten"],
    ["siam", "indonesien"],
  ];
  check(
    "Seewege verbinden die Übersee-Nachbarn",
    RISKO_SEA.length === 9 && seas.every(([a, b]) => riskoNeighbors(a!).includes(b!)) && RISKO_SEA.every((route) => riskoNeighbors(route.a).includes(route.b)) && riskoNeighbors("mittelamerika").includes("venezuela"),
  );
  check(
    "die Startarmeen folgen der Personenzahl",
    armiesOf(made) === 80 &&
      made.mode === "auftrag" &&
      armiesOf(createRisko(people(3), "voll", rng(3))) === 105 &&
      armiesOf(createRisko(people(4), "voll", rng(3))) === 120 &&
      armiesOf(createRisko(people(5), "voll", rng(3))) === 125 &&
      armiesOf(createRisko(people(6), "kurz", rng(3))) === 120 &&
      createRisko(people(2), "voll", rng(3)).mode === "welt" &&
      made.deck.length === 44 &&
      RISKO_MISSIONS.length === 14 &&
      tradeValue(0) === 4 &&
      tradeValue(5) === 15 &&
      tradeValue(6) === 20,
  );
  check("ein Satz ist drei gleiche oder je eines", riskoIsSet(["inf", "inf", "inf"]) && riskoIsSet(["inf", "kav", "joker"]) && !riskoIsSet(["inf", "inf", "kav"]));
  const own = Object.entries(made.lands).find(([, land]) => land.owner === 0)![0];
  const placed = applyRisko(structuredClone(made), "p0", { type: "risko-place", id: own });
  check("setzen nimmt eine Armee aus dem Vorrat", placed.lands[own]!.armies === made.lands[own]!.armies + 1 && placed.pool[0] === made.pool[0]! - 1);
  let refused = false;
  try {
    const enemy = Object.entries(made.lands).find(([, land]) => land.owner === 1)![0];
    applyRisko(structuredClone(made), "p0", { type: "risko-place", id: enemy });
  } catch {
    refused = true;
  }
  check("fremde Gebiete nehmen nichts an", refused);

  let tied = false;
  for (let seed = 1; seed < 80 && !tied; seed++) {
    const round = stageAttack(people(2), "alaska", "kamtschatka", seed, ["alaska"]);
    round.lands.alaska = { owner: 0, armies: 2 };
    const next = applyRisko(structuredClone(round), "p0", { type: "risko-attack", from: "alaska", to: "kamtschatka", dice: 1 });
    tied = next.last?.attack[0] === next.last?.defend[0] && next.lands.kamtschatka!.owner === 1 && next.lands.alaska!.armies === 1;
  }
  check("bei Gleichstand hält die Verteidigung", tied);

  let taken: RiskoState | null = null;
  for (let seed = 1; seed < 80 && !taken; seed++) {
    const next = applyRisko(stageAttack(people(2), "alaska", "nordwest", seed, ["alaska"]), "p0", { type: "risko-attack", from: "alaska", to: "nordwest", dice: 1 });
    if (next.phase === "occupy" && next.occupy?.min === 1 && next.last?.attack.length === 1 && next.last.defend.length === 1) taken = next;
  }
  check("eine Eroberung verlangt das Nachziehen", taken != null && taken.lands.nordwest!.armies === 0);
  const occupied = taken ? applyRisko(taken, "p0", { type: "risko-occupy", n: taken.occupy!.min }) : taken;
  check("nachgezogen wird mindestens die Würfelzahl", occupied?.lands.alaska!.armies === 7 && occupied.lands.nordwest!.armies === 1 && occupied.phase === "attack");

  const south = createRisko(people(2), "voll", rng(2));
  south.phase = "fortify";
  south.turn = 1;
  south.pool = [0, 0];
  for (const land of Object.values(south.lands)) land.owner = 1;
  for (const id of ["venezuela", "peru", "brasilien", "argentinien"]) south.lands[id] = { owner: 0, armies: 1 };
  const income = applyRisko(south, "p1", { type: "risko-end" });
  check("Südamerika gibt zwei Extraarmeen", income.turn === 0 && income.pool[0] === 5 && income.phase === "place");

  const cards = made.deck.filter((card) => card.symbol === "inf").slice(0, 3);
  const trade = structuredClone(made);
  trade.phase = "place";
  trade.turn = 0;
  trade.pool = [0, 0];
  trade.hands[0] = cards;
  const bonus = cards[0]!.land!;
  for (const card of cards) {
    if (card.land) trade.lands[card.land] = { owner: card.land === bonus ? 0 : 1, armies: 1 };
  }
  const cashed = applyRisko(trade, "p0", { type: "risko-trade", ids: cards.map((card) => card.id) });
  check("der erste Tausch bringt 4 und 2 auf dem eigenen Gebiet", cashed.pool[0] === 4 && cashed.lands[bonus]!.armies === 3 && cashed.trades === 1 && cashed.hands[0]!.length === 0);

  let blocked = false;
  try {
    const full = structuredClone(made);
    full.phase = "place";
    full.hands[0] = made.deck.slice(0, 5);
    applyRisko(full, "p0", { type: "risko-place", id: own });
  } catch {
    blocked = true;
  }
  check("fünf Karten erzwingen den Tausch", blocked);

  const shift = createRisko(people(2), "kurz", rng(1));
  shift.phase = "fortify";
  shift.turn = 0;
  shift.pool = [0, 0];
  for (const land of Object.values(shift.lands)) land.owner = 1;
  shift.lands.alaska = { owner: 0, armies: 6 };
  shift.lands.nordwest = { owner: 0, armies: 1 };
  const moved = applyRisko(shift, "p0", { type: "risko-fortify", from: "alaska", to: "nordwest", n: 2 });
  check("verschieben lässt eine Armee zurück", moved.lands.alaska!.armies === 4 && moved.lands.nordwest!.armies === 3 && moved.turn === 1);
  let apart = false;
  try {
    const split = structuredClone(shift);
    split.phase = "fortify";
    split.turn = 0;
    split.lands.brasilien = { owner: 0, armies: 1 };
    applyRisko(split, "p0", { type: "risko-fortify", from: "alaska", to: "brasilien" });
  } catch {
    apart = true;
  }
  check("getrennte Gebiete schieben nichts", apart);

  let mission: RiskoState | null = null;
  const owned = RISKO_LANDS.map((land) => land.id).filter((id) => id !== "kamtschatka").slice(0, 23);
  for (let seed = 1; seed < 80 && !mission; seed++) {
    const round = stageAttack(people(2), "alaska", "kamtschatka", seed, owned);
    round.mode = "auftrag";
    round.missions[0] = "lands-24";
    const next = applyRisko(round, "p0", { type: "risko-attack", from: "alaska", to: "kamtschatka" });
    if (next.lands.kamtschatka!.owner !== 0) continue;
    mission = next.phase === "occupy" ? applyRisko(next, "p0", { type: "risko-occupy", n: next.occupy!.min }) : next;
  }
  check("24 Gebiete erfüllen den Auftrag", mission?.phase === "done" && mission.winnerIds?.[0] === "p0");

  let passed = false;
  const world = createRisko(people(2), "voll", rng(4));
  world.phase = "fortify";
  world.turn = 0;
  world.mode = "welt";
  for (const land of Object.values(world.lands)) land.owner = 1;
  for (const id of owned) world.lands[id] = { owner: 0, armies: 1 };
  const still = applyRisko(world, "p0", { type: "risko-end" });
  passed = still.phase !== "done";
  check("Welteroberung endet nicht bei 24 Gebieten", passed);

  const crowd = stageAttack(people(3), "alaska", "kamtschatka", 1, ["alaska"]);
  crowd.mode = "auftrag";
  crowd.missions = ["lands-18", "lands-24", "wipe-1"];
  let swapped: RiskoState | null = null;
  for (let seed = 1; seed < 80 && !swapped; seed++) {
    const round = structuredClone(crowd);
    round.seed = seed;
    const next = applyRisko(round, "p0", { type: "risko-attack", from: "alaska", to: "kamtschatka" });
    if (next.lands.kamtschatka!.owner === 0) swapped = next;
  }
  check("eine fremde Vernichtung wird zu 24 Gebieten", swapped?.missions[2] === "lands-24" && swapped.phase === "occupy" && swapped.hands[0]!.length === 0);

  let card: RiskoState | null = null;
  if (occupied && occupied.phase === "attack") {
    occupied.lands.alaska!.armies = 8;
    for (let seed = 1; seed < 80 && !card; seed++) {
      const round = structuredClone(occupied);
      round.seed = seed;
      round.lands.alberta = { owner: 1, armies: 1 };
      const next = applyRisko(round, "p0", { type: "risko-attack", from: "alaska", to: "alberta" });
      if (next.lands.alberta!.owner !== 0 || next.phase !== "occupy") continue;
      const held = applyRisko(next, "p0", { type: "risko-occupy", n: next.occupy!.min });
      card = applyRisko(held, "p0", { type: "risko-halt" });
    }
  }
  check("ein Zug bringt höchstens eine Karte", card?.hands[0]?.length === 1 && card.deck.length === 43);
}

wizardCards();
playBot();
playWizard();
playSchiffe();
playUno();
playScotland();
playSketch();
playLove();
playRisko();

if (failed > 0) {
  console.error(`${failed} tests failed`);
  process.exit(1);
}
console.log("alle spieltests grün");
