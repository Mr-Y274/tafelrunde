import type { GameId } from "./types";

export type GameInfo = {
  id: GameId;
  name: string;
  players: string;
  min: number;
  max: number;
  blurb: string;
  rules: string[];
};

export const CATALOG: GameInfo[] = [
  {
    id: "wizard",
    name: "Wizard",
    players: "2–6",
    min: 2,
    max: 6,
    blurb: "Sag an, wie viele Stiche du holst. Zauberer sticht alles, der Narr nichts.",
    rules: [
      "Jede Runde gibt es eine Karte mehr. Kurz sind 6 Runden, voll so viele wie der Stapel hergibt. Zu zweit sind das 30 Runden, in der letzten liegt kein Trumpf aus.",
      "Die aufgedeckte Karte ist Trumpf. Ein Zauberer: der Geber wählt die Farbe. Ein Narr: kein Trumpf.",
      "Angesagt wird offen, beginnend links vom Geber.",
      "Bedient wird. Zauberer und Narren darfst du immer legen.",
      "Genau getroffen: 20 plus 10 je angesagtem Stich. Daneben: minus 10 je Stich Abweichung.",
    ],
  },
  {
    id: "schiffe",
    name: "Schiffe versenken",
    players: "2",
    min: 2,
    max: 2,
    blurb: "Fünf Schiffe, ein Gitter, abwechselnd feuern. Versenkt gewinnt.",
    rules: [
      "Schlachtschiff 5, Kreuzer 4, Zerstörer 3, U-Boot 3, Boot 2.",
      "Schiffe liegen gerade, dürfen sich berühren, nicht überlappen.",
      "Wer beide Flotten gesetzt hat, schießt. Ein Schuss pro Zug.",
      "Wasser wird grau, ein Treffer rot. Ist das Schiff versenkt, werden alle seine Felder grün.",
    ],
  },
  {
    id: "scotland",
    name: "Scotland Yard",
    players: "2–5",
    min: 2,
    max: 5,
    blurb: "Mr. X hat einen Hubschrauber. Die Detektive haben Analyse, Ortung, Abtasten und Befragung.",
    rules: [
      "Mr. X wird ausgelost. Alle wissen, wer es ist. Niemand sieht, wo. Zu zweit jagt ein Detektiv allein.",
      "London, Paris oder Barcelona. Hinter dem Netz liegt ein Bild der Stadt. Taxi, Bus, U-Bahn und, wo ein Fluss oder Hafen ist, die Fähre.",
      "Kurz ist schwer für Mr. X: 13 Runden, er startet in der Mitte, die Detektive nah. Voll ist leichter: 22 Runden, er startet am Rand, die Detektive weit weg.",
      "Detektive: 10 Taxi, 8 Bus, 4 U-Bahn. Mr. X: 4 Taxi, 3 Bus, 3 U-Bahn, 5 Schwarz, 2 Doppelzüge, 2 Hubschrauber.",
      "Der Hubschrauber fliegt zur nächsten Sehenswürdigkeit dieser Stadt.",
      "Einmal pro Runde ermitteln die Detektive gemeinsam. Analyse zeigt mögliche Stationen, Ortung die Funkmasten, Abtasten die Taxischritte, Befragung die Zeugen.",
      "Mr. X bekommt nach und nach fünf Treffpunkte. Einer reicht zum Entkommen, zwei gewinnen sofort. Ohne Treffpunkt verliert er am Ende.",
      "Sichtbar wird er in der kurzen Jagd in Runde 3, 8 und 13, in der langen in 3, 8, 13, 18 und 22.",
    ],
  },
  {
    id: "uno",
    name: "Uno",
    players: "2–8",
    min: 2,
    max: 8,
    blurb: "Farbe oder Symbol. Wer zuerst alles los ist, kassiert die Punkte.",
    rules: [
      "Sieben Karten. Passend zur Farbe oder zum Symbol, Joker immer.",
      "Aussetzen, Richtungswechsel, +2. Bei zwei Leuten ist der Richtungswechsel ein Aussetzen.",
      "+4 darfst du anzweifeln. Hatte die Person die Farbe, zieht sie selbst vier. Sonst ziehst du sechs.",
      "Bei einer Karte musst du Uno sagen. Wer es vergisst, kann erwischt werden und zieht zwei.",
      "Kurze Partie bis 100, lange bis 200.",
    ],
  },
  {
    id: "pictionary",
    name: "Pictionary",
    players: "2–8",
    min: 2,
    max: 8,
    blurb: "Eine Person zeichnet, die anderen raten. Siebzig Sekunden, keine Buchstaben.",
    rules: [
      "Kurz zeichnet jede Person einmal, bei mehreren Runden dreimal. Das Wort sieht nur, wer den Stift hat.",
      "Jede Runde hat einen Themenbereich. Den sehen alle, das Wort nur die zeichnende Person.",
      "Wer das Wort nicht kennt, darf es dreimal skippen und bekommt ein neues.",
      "Wer richtig rät, bekommt 10 Punkte, die zeichnende Person auch.",
      "Nach der Runde oder wenn die Zeit um ist, wird das Wort aufgedeckt.",
    ],
  },
  {
    id: "zehn",
    name: "Phase 10",
    players: "2–6",
    min: 2,
    max: 6,
    blurb: "Hase, Bär, Fuchs und Eule sammeln Sätze und Reihen. Der Kuss hilft, Schlaf lässt jemanden aussetzen.",
    rules: [
      "Zehn Karten. Du ziehst eine, vom Stapel oder von der Ablage, und legst am Ende genau eine ab.",
      "Kurz sind vier Aufgaben, voll alle zehn. Ein Satz sind gleiche Zahlen, eine Reihe aufeinanderfolgende, eine Familie ein Tier.",
      "Der Kuss ist jede Zahl und jedes Tier. Schlaf gehört in keine Aufgabe und lässt die nächste Person aussetzen.",
      "Liegt deine Aufgabe, darfst du an alle Gruppen anlegen. Eine Karte bleibt immer zum Ablegen.",
      "Wer bei der letzten Aufgabe alle Karten los wird, gewinnt.",
    ],
  },
  {
    id: "stapel",
    name: "Stapeln",
    players: "2–6",
    min: 2,
    max: 6,
    blurb: "Jede Person hat einen Liebesstapel. Gemeinsam baut ihr von 1 bis 12, der Kuss ist jede Zahl.",
    rules: [
      "Oben auf dem eigenen Liebesstapel liegt eine Karte offen. Wer ihn leer spielt, gewinnt.",
      "Kurz ist der Stapel kleiner, voll größer.",
      "Zu Beginn des Zugs füllst du die Hand auf fünf Karten.",
      "Gebaut wird aus der Hand, von den eigenen Ablagen oder vom Liebesstapel. Bei 12 leert sich der Baustapel.",
      "Eine Karte auf eine der vier Ablagen beendet den Zug. Ist die Hand leer, ziehst du neu und spielst weiter.",
    ],
  },
  {
    id: "memo",
    name: "Memo",
    players: "2–6",
    min: 2,
    max: 6,
    blurb: "Zwei Tierchen aufdecken. Ein Paar bleibt bei dir, du bist noch einmal dran.",
    rules: [
      "Kurz sind acht Paare, voll fünfzehn.",
      "Decke zwei Karten auf. Passen sie, gehören sie dir.",
      "Passen sie nicht, sehen alle hin. Dann deckst du sie zu und die nächste Person sucht.",
      "Die meisten Paare gewinnen. Bei Gleichstand gewinnen alle, die vorne liegen.",
    ],
  },
  {
    id: "vier",
    name: "Vier gewinnt",
    players: "2",
    min: 2,
    max: 2,
    blurb: "Ein Herz fällt in eine Spalte. Vier in einer Reihe gewinnen.",
    rules: [
      "Sieben Spalten, sechs Reihen. Das Herz rutscht nach unten.",
      "Abwechselnd. Vier gleiche Herzen waagerecht, senkrecht oder schräg gewinnen.",
      "Ist alles voll, ohne vier in einer Reihe, endet es unentschieden.",
    ],
  },
  {
    id: "mau",
    name: "MAU MAU",
    players: "2–6",
    min: 2,
    max: 6,
    blurb: "Gleiches Tier oder gleiche Karte. Der Bube sucht das nächste Tier aus.",
    rules: [
      "Hase, Bär, Fuchs und Eule, von 7 bis Ass. Kurz fünf Karten, voll sieben, soweit der Stapel reicht.",
      "Du legst ein passendes Tier oder dieselbe Karte. Der Bube geht immer und sucht das nächste Tier.",
      "Die 7 lässt zwei Karten ziehen und darf gestapelt werden. Die 8 setzt aus. Das Ass dreht die Richtung, zu zweit lässt es noch einmal legen.",
      "Wer zuerst nichts mehr auf der Hand hat, gewinnt.",
    ],
  },
];

export function gameInfo(id: string): GameInfo | undefined {
  return CATALOG.find((game) => game.id === id);
}
