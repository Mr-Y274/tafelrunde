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
      "Jede Runde gibt es eine Karte mehr. Kurz sind 6 Runden, voll so viele wie der Stapel hergibt. Zu zweit sind das 30 Runden mit dem Farbblatt und 20 mit dem Skatblatt. In der letzten liegt kein Trumpf aus.",
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
    players: "2–6",
    min: 2,
    max: 6,
    blurb: "Mr. X versteckt sich. Die Detektive jagen ihn über Taxi, Bus und U-Bahn.",
    rules: [
      "2 bis 6 Personen. Eine ist Mr. X, die anderen sind Detektive. Es jagen immer mindestens drei Figuren. Freie Figuren zieht der Detektiv selbst mit.",
      "London, Paris oder Barcelona, je 199 Stationen. Gelb ist Taxi, Grün der Bus, Rot die U-Bahn, Schwarz gestrichelt die Fähre.",
      "Die Startstationen werden aus den Startfeldern gezogen. Keine zwei Figuren starten gleich.",
      "Detektive: 10 Taxi, 8 Bus, 4 U-Bahn. Jedes benutzte Ticket wandert zu Mr. X.",
      "Mr. X: 4 Taxi, 3 Bus, 3 U-Bahn, so viele Schwarz wie Detektive mitspielen, und 2 Doppelzüge. Schwarz fährt jedes Verkehrsmittel, auch die Fähre.",
      "24 Züge. Mr. X zieht zuerst. Sichtbar wird er in Runde 3, 8, 13, 18 und 24. Sonst sehen die Detektive nur das Ticket.",
      "Detektive dürfen nicht auf derselben Station stehen. Wer Mr. X erreicht, gewinnt mit den Detektiven. Nach Zug 24 oder wenn niemand mehr fahren kann, gewinnt Mr. X.",
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
      "Sieben Karten. Passend zur Farbe oder zum Symbol, Rainbow immer.",
      "Aussetzen, Richtungswechsel, +2. +2 stapelt sich auf jede andere +2, egal welche Farbe. Bei zwei Leuten ist der Richtungswechsel ein Aussetzen.",
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
      "Wer das Wort nicht kennt, darf es dreimal überspringen und bekommt ein neues.",
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
    blurb: "Rot, Gelb, Grün und Blau sammeln Sätze und Reihen. Wild hilft, Skip lässt jemanden aussetzen.",
    rules: [
      "Zehn Karten. Du ziehst eine, vom Stapel oder von der Ablage, und legst am Ende genau eine ab.",
      "Kurz sind vier Aufgaben, voll alle zehn. Ein Satz sind gleiche Zahlen, eine Reihe aufeinanderfolgende, eine Farbe ist eine Farbe.",
      "Wild ist jede Zahl und jede Farbe. Skip gehört in keine Aufgabe und lässt die nächste Person aussetzen.",
      "Liegt deine Aufgabe, darfst du an alle Gruppen anlegen. Eine Karte bleibt immer zum Ablegen.",
      "Wer bei der letzten Aufgabe alle Karten los wird, gewinnt.",
    ],
  },
  {
    id: "stapel",
    name: "Skip-Bo",
    players: "2–6",
    min: 2,
    max: 6,
    blurb: "Jede Person hat einen Vorrat. Gemeinsam baut ihr von 1 bis 12. Skip-Bo ist jede Zahl.",
    rules: [
      "Oben auf dem eigenen Vorrat liegt eine Karte offen. Wer ihn leer spielt, gewinnt.",
      "Der Vorrat hat 10, 20 oder 30 Karten. Zu sechst passen 30 nicht.",
      "Zu Beginn des Zugs füllst du die Hand auf fünf Karten.",
      "Gebaut wird aus der Hand, von den eigenen Ablagen oder vom Vorrat. Bei 12 wird der Baustapel weggeräumt.",
      "Eine Karte auf eine der vier Ablagen beendet den Zug. Ist die Hand leer, ziehst du fünf neue und spielst weiter.",
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
      "Das Feld hat 12, 20 oder 30 Kacheln.",
      "Decke zwei Karten auf. Passen sie, gehören sie dir.",
      "Passen sie nicht, sehen alle hin. Dann deckst du sie zu und die nächste Person sucht.",
      "Die meisten Paare gewinnen. Bei Gleichstand gewinnen alle, die vorne liegen.",
    ],
  },
  {
    id: "vier",
    name: "Vier gewinnt",
    players: "2–4",
    min: 2,
    max: 4,
    blurb: "Ein Herz fällt in eine Spalte. Vier in einer Reihe gewinnen.",
    rules: [
      "Zwei bis vier Personen. Das Feld ist 6×5, 7×6 oder 9×7.",
      "Das Herz rutscht nach unten. Der letzte Stein ist lila umrandet.",
      "Vier gleiche Herzen waagerecht, senkrecht oder schräg gewinnen.",
      "Ist alles voll, ohne vier in einer Reihe, endet es unentschieden.",
    ],
  },
  {
    id: "risko",
    name: "Risko",
    players: "2–6",
    min: 2,
    max: 6,
    blurb: "42 Gebiete, Würfel und Karten. Welteroberung oder ein geheimer Auftrag.",
    rules: [
      "2 bis 6 Personen. 42 Gebiete auf sechs Kontinenten. Zu zweit 40 Armeen, zu dritt 35, zu viert 30, zu fünft 25, zu sechst 20. Auf jedem Gebiet liegt zuerst eine Armee, den Rest setzt ihr reihum.",
      "Ein Zug hat drei Phasen. Zuerst Armeen: mindestens 3, sonst ein Drittel der eigenen Gebiete, plus den Kontinentbonus. Drei gleiche Kartensymbole oder je eines tauschen 4, 6, 8, 10, 12, 15 und danach je 5 weitere Armeen. Ab fünf Karten musst du tauschen. Liegt ein eingetauschtes Gebiet bei dir, kommen 2 Armeen direkt darauf.",
      "Angreifen darfst du benachbarte Gebiete, auch über die gestrichelten Seewege. Du würfelst mit 1 bis 3, solange eine Armee zurückbleibt. Die Verteidigung würfelt mit 1 oder 2. Der höhere Würfel gewinnt, bei Gleichstand die Verteidigung. Nach einer Eroberung ziehst du mindestens so viele Armeen nach, wie du Würfel benutzt hast.",
      "Eroberst du in dem Zug mindestens ein Gebiet, ziehst du danach genau eine Karte. Am Ende darfst du einmal Armeen über eigene, verbundene Gebiete verschieben.",
      "Geheimaufträge gewinnt, wer den eigenen Auftrag erfüllt. Welteroberung gewinnt, wer alle 42 Gebiete hält.",
    ],
  },
];

export function gameInfo(id: string): GameInfo | undefined {
  return CATALOG.find((game) => game.id === id);
}
