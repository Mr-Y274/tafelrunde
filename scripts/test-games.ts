import { cityConnected, cityLinks, cityMap } from "../lib/games/city-maps";
import { createSchiffe, applySchiffe } from "../lib/games/schiffe";
import { applyWizard, createWizard, wizardCanPlay, wizardTrickWinner } from "../lib/games/wizard";
import { applyUno, createUno, unoCardCount } from "../lib/games/uno";
import { applyScotland, createScotland, scotlandMoves, viewScotland } from "../lib/games/scotland";
import { applyPictionary, createPictionary, normalizeGuess, viewPictionary } from "../lib/games/pictionary";
import { applyMau, createMau, mauCardCount, mauFits } from "../lib/games/mau";
import { applyMemo, createMemo, viewMemo } from "../lib/games/memo";
import { applyStapel, createStapel, stapelFits } from "../lib/games/stapel";
import { applyVier, createVier } from "../lib/games/vier";
import { applyZehn, createZehn, zehnCardCount } from "../lib/games/zehn";
import type { HerzCard, Player, ScotlandState, UnoState, WCard, WizardState } from "../lib/games/types";
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
  check("drei Städte sind verbunden", cityConnected("london") && cityConnected("paris") && cityConnected("barcelona"));
  check(
    "jede Stadt hat ein Bild",
    [london, paris, barcelona].every((city) => city.image.endsWith(".jpg") && city.sights.length === 3 && new Set(city.masts.map((mast) => mast.id)).size === 4),
  );
  const pair = createScotland(people(2), "kurz", () => 0, "london");
  check("Scotland Yard zu zweit hat einen Detektiv", pair.detectives.length === 1 && pair.city === "london");
  check(
    "kurze Jagd gibt enge Startfelder",
    pair.phase === "mrx" && pair.positions[pair.mrX] === london.opening.kurz[0] && pair.positions[pair.detectives[0]!] === london.opening.kurz[1],
  );
  const easy = createScotland(people(2), "voll", () => 0, "paris");
  check(
    "lange Jagd in Paris stellt Mr. X an den Rand",
    easy.city === "paris" && easy.positions[easy.mrX] === paris.opening.voll[0] && easy.positions[easy.detectives[0]!] === paris.opening.voll[1] && easy.maxRounds === 22,
  );
  const spain = createScotland(people(2), "kurz", () => 0, "barcelona");
  check("Barcelona hat eigene Startfelder", spain.city === "barcelona" && spain.positions[spain.mrX] === barcelona.opening.kurz[0]);
  const crowd = createScotland(people(5), "kurz", () => 0);
  const starts = [crowd.positions[crowd.mrX], ...crowd.detectives.map((id) => crowd.positions[id])];
  check("fünf Startfelder bleiben verschieden", new Set(starts).size === 5 && starts.every((id) => london.stations.some((spot) => spot.id === id)));
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
  check("Scotland Yard zu zweit startet die Jagd", duo.phase === "mrx");
  const water = london.edges.find((edge) => edge.mode === "water")!;
  duo.positions[duo.mrX] = water.a;
  const ferry = scotlandMoves(duo, duo.mrX);
  check(
    "Fähre nur mit Schwarz",
    ferry.some((move) => move.to === water.b && move.ticket === "black") && !ferry.some((move) => move.to === water.b && move.ticket !== "black"),
  );
  const hunter = createScotland(people(2), "kurz", () => 0);
  hunter.phase = "det";
  hunter.positions[hunter.detectives[0]!] = water.a;
  check("Detektiv nimmt keine Fähre", !scotlandMoves(hunter, hunter.detectives[0]!).some((move) => move.to === water.b));
  let state = createScotland(people(3), "kurz", () => 0);
  const dets = state.detectives;
  check("Jagd startet versteckt", state.phase === "mrx");
  const hidden = viewScotland(state, dets[0]!).positions.find((player) => player.role === "mrx");
  check("Detektiv sieht Mr. X nicht", hidden?.station == null);
  const random = rng(4);
  let guard = 0;
  while (state.phase !== "done" && guard < 500) {
    guard += 1;
    const view = viewScotland(state, state.phase === "mrx" || state.phase === "mrx-start" ? state.mrX : state.detectives[state.picker]!);
    if (view.choices && view.choices.length) {
      state = applyScotland(state, view.turnId!, { type: "sy-start", station: view.choices[0]! });
      continue;
    }
    const pool = view.moves.filter((move) => (random() > 0.85 ? true : move.doubleTo == null));
    const move = pool[Math.floor(random() * pool.length)] ?? view.moves[0];
    if (!move || !view.turnId) break;
    state = applyScotland(state, view.turnId, {
      type: "sy-move",
      to: move.to,
      ticket: move.ticket,
      doubleTo: move.doubleTo,
      doubleTicket: move.doubleTicket,
    });
  }
  check("Scotland Yard endet", state.phase === "done" && (state.winnerIds?.length ?? 0) > 0);
  const master = createScotland(people(2), "kurz", () => 0);
  check("Mr. X hat zwei Hubschrauber", master.tickets[master.mrX]?.heli === 2 && master.maxRounds === 13);
  const sightIds = new Set(london.sights.map((sight) => sight.id));
  master.positions[master.mrX] = london.opening.kurz[0]!;
  master.positions[master.detectives[0]!] = london.opening.kurz[1]!;
  let flying = master;
  const chopper = scotlandMoves(flying, flying.mrX).filter((move) => move.ticket === "heli");
  check("Hubschrauber fliegt zu einer Sehenswürdigkeit", chopper.length > 0 && chopper.every((move) => sightIds.has(move.to)));
  check("Detektive haben keinen Hubschrauber", !scotlandMoves(flying, flying.detectives[0]!).some((move) => move.ticket === "heli"));
  const sight = london.sights[0]!;
  flying.positions[flying.mrX] = sight.id;
  flying.phase = "det";
  flying.picker = 0;
  flying.probed = false;
  const asked = applyScotland(flying, flying.detectives[0]!, { type: "sy-probe", kind: "befragung" });
  const witness = asked.probe?.kind === "befragung" ? asked.probe.witnesses.find((item) => item.id === sight.id) : null;
  check("Befragung sieht Mr. X an der Sehenswürdigkeit", witness?.saw === "hier" && viewScotland(asked, asked.mrX).probe == null);
  let blockedProbe = false;
  try {
    applyScotland(asked, asked.detectives[0]!, { type: "sy-probe", kind: "ortung" });
  } catch {
    blockedProbe = true;
  }
  check("die zweite Ermittlung wartet bis zur nächsten Runde", blockedProbe);
  let points = createScotland(people(2), "kurz", () => 0);
  const origin = london.opening.kurz[0]!;
  points.positions[points.mrX] = origin;
  points.positions[points.detectives[0]!] = london.opening.kurz[1]!;
  const firstStop = cityLinks("london", origin, "taxi").find((id) => id !== london.opening.kurz[1])!;
  const secondStop = cityLinks("london", firstStop, "taxi").find((id) => id !== origin)!;
  points.meetings = [firstStop, secondStop];
  points.round = points.maxRounds;
  points.meetHits = [];
  points = applyScotland(points, points.mrX, { type: "sy-move", to: firstStop, ticket: "taxi" });
  check("ein Treffpunkt hält die Jagd offen", points.phase === "det" && points.meetHits.includes(firstStop));
  points.phase = "mrx";
  points = applyScotland(points, points.mrX, { type: "sy-move", to: secondStop, ticket: "taxi" });
  check("zwei Treffpunkte gewinnen sofort", points.phase === "done" && points.winnerIds?.[0] === points.mrX);
  const revealed = (state as ScotlandState).moves.find((move) => state.reveals.includes(move.round));
  if (revealed && state.winnerIds?.[0] !== state.mrX) {
    const detectiveView = viewScotland(state, state.detectives[0] ?? state.players[0]!.id);
    const row = detectiveView.travel.find((item) => item.round === revealed.round);
    check("Aufdeckrunde zeigt die Station", row?.station === revealed.station);
  } else check("Aufdeckrunde ist entstanden oder Mr. X entkommt", true);
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

function herz(id: string, n: number, animal: HerzCard["animal"] = "hase"): HerzCard {
  return { id, kind: "zahl", animal, n };
}

function playLove() {
  const zehn = createZehn(people(2), "kurz", rng(8));
  check("Phase 10 hat 108 Karten", zehnCardCount(zehn) === 108);
  zehn.step = "play";
  zehn.hands.p0 = [herz("a", 5), herz("b", 5, "baer"), herz("c", 5, "fuchs"), herz("d", 7), herz("e", 7, "eule"), herz("f", 7, "baer"), herz("g", 1)];
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
  sleepy.hands.p0 = [{ id: "sch", kind: "schlaf", animal: null, n: null }, herz("keep", 3)];
  const skipped = applyZehn(sleepy, "p0", { type: "zehn-discard", id: "sch" });
  check("Schlaf lässt die andere Person aussetzen", skipped.turn === 0 && skipped.step === "draw");
  check("eine zweite Aufgabe im selben Zug geht nicht", slept);

  const last = createZehn(people(2), "kurz", rng(10));
  last.goal = 1;
  last.step = "play";
  last.hands.p0 = [herz("a", 4), herz("b", 4, "fuchs"), herz("c", 4, "eule"), herz("d", 9), herz("e", 9, "baer"), herz("f", 9, "fuchs"), herz("g", 2)];
  let gone = applyZehn(last, "p0", { type: "zehn-lay", groups: [["a", "b", "c"], ["d", "e", "f"]] });
  gone = applyZehn(gone, "p0", { type: "zehn-discard", id: "g" });
  check("die letzte Aufgabe und leere Hand gewinnen", gone.phase === "done" && gone.winnerIds?.[0] === "p0");

  const kiss = createStapel(people(2), "kurz", rng(11));
  kiss.hands.p0 = [{ id: "kuss", n: null, wild: true }, { id: "drei", n: 3 }, { id: "eins", n: 1 }, { id: "zwei", n: 2 }];
  kiss.piles = [[], [], [], []];
  let built = applyStapel(kiss, "p0", { type: "stapel-play", from: "hand", id: "kuss", pile: 0 });
  check("der Kuss wird zur Eins", built.piles[0]?.[0]?.n === 1);
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
  check("der leere Liebesstapel gewinnt", won.phase === "done" && won.winnerIds?.[0] === "p0");
  const pass = createStapel(people(2), "kurz", rng(13));
  const card = pass.hands.p0?.[0];
  const handed = applyStapel(pass, "p0", { type: "stapel-end", id: card?.id, slot: 0 });
  check("Ablegen gibt weiter und füllt die nächste Hand", handed.turn === 1 && (handed.hands.p1?.length ?? 0) === 5);

  const memo = createMemo(people(2), "kurz", rng(14));
  check("Memo hat acht Paare", memo.tiles.length === 16);
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

  const mau = createMau(people(2), "kurz", rng(15));
  check("MAU MAU hat 32 Karten", mauCardCount(mau) === 32);
  mau.top = { id: "top", animal: "hase", rank: "9" };
  mau.animal = "hase";
  mau.pending = 0;
  mau.phase = "play";
  mau.turn = 0;
  mau.hands.p0 = [
    { id: "passend", animal: "fuchs", rank: "9" },
    { id: "bube", animal: "baer", rank: "B" },
    { id: "sieben", animal: "hase", rank: "7" },
    { id: "fremd", animal: "eule", rank: "8" },
  ];
  check("gleiche Karte passt, fremdes Tier nicht", mauFits(mau.hands.p0[0]!, mau.top, mau.animal, 0) && !mauFits(mau.hands.p0[3]!, mau.top, mau.animal, 0));
  let round = applyMau(mau, "p0", { type: "mau-play", id: "sieben" });
  check("die Sieben lässt zwei ziehen", round.pending === 2 && round.turn === 1);
  round.hands.p1 = [{ id: "noch", animal: "hase", rank: "7" }, { id: "ruhe", animal: "hase", rank: "10" }];
  round = applyMau(round, "p1", { type: "mau-play", id: "noch" });
  check("eine zweite Sieben stapelt", round.pending === 4);
  const bube = createMau(people(2), "kurz", rng(16));
  bube.top = { id: "top", animal: "hase", rank: "9" };
  bube.animal = "hase";
  bube.pending = 0;
  bube.turn = 0;
  bube.phase = "play";
  bube.hands.p0 = [{ id: "bube", animal: "baer", rank: "B" }, { id: "rest", animal: "hase", rank: "8" }];
  const chosen = applyMau(bube, "p0", { type: "mau-play", id: "bube", animal: "eule" });
  check("der Bube sucht das Tier aus", chosen.animal === "eule");
  const out = createMau(people(2), "kurz", rng(17));
  out.top = { id: "top", animal: "baer", rank: "10" };
  out.animal = "baer";
  out.pending = 0;
  out.turn = 0;
  out.phase = "play";
  out.hands.p0 = [{ id: "letzte", animal: "baer", rank: "K" }];
  const empty = applyMau(out, "p0", { type: "mau-play", id: "letzte" });
  check("die letzte Karte gewinnt MAU MAU", empty.phase === "done" && empty.winnerIds?.[0] === "p0");
}

wizardCards();
playWizard();
playSchiffe();
playUno();
playScotland();
playSketch();
playLove();

if (failed > 0) {
  console.error(`${failed} tests failed`);
  process.exit(1);
}
console.log("alle spieltests grün");
