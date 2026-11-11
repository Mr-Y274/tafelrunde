import type { GameId } from "./types";

export type GuideSection = { title: string; lines: string[] };

export const GUIDES: Record<GameId, GuideSection[]> = {
  wizard: [
    {
      title: "Die Runde",
      lines: [
        "Kurz sind 6 Runden. Voll geht so lange, bis der Stapel leer ist. Zu zweit sind das 30 Runden.",
        "Jede Runde gibt es eine Karte mehr. In der ersten Runde eine, dann zwei, und so weiter.",
        "Gegeben wird reihum. Die oberste Karte danach liegt offen und bestimmt den Trumpf.",
      ],
    },
    {
      title: "Trumpf",
      lines: [
        "Eine normale Karte: ihre Farbe ist Trumpf.",
        "Ein Zauberer: die gebende Person wählt die Trumpffarbe.",
        "Ein Narr: es gibt keinen Trumpf. In der letzten Runde zu zweit liegt keine Trumpfkarte aus.",
      ],
    },
    {
      title: "Ansage und Stich",
      lines: [
        "Jede Person sagt offen an, wie viele Stiche sie holt. Begonnen wird links von der gebenden Person.",
        "Bedient wird. Hast du die angespielte Farbe, musst du sie legen. Zauberer und Narren darfst du immer legen.",
        "Der erste Zauberer gewinnt den Stich. Sonst sticht Trumpf, sonst die höchste Karte der angespielten Farbe. Nur Narren: der erste Narr gewinnt.",
      ],
    },
    {
      title: "Punkte",
      lines: [
        "Genau getroffen: 20 Punkte plus 10 für jeden angesagten Stich.",
        "Daneben: minus 10 für jeden Stich, den du zu viel oder zu wenig hast.",
        "Wer am Ende die meisten Punkte hat, gewinnt.",
      ],
    },
  ],
  schiffe: [
    {
      title: "Die Flotte",
      lines: [
        "Jede Person setzt fünf Schiffe: Schlachtschiff 5, Kreuzer 4, Zerstörer 3, U-Boot 3 und Boot 2.",
        "Schiffe liegen gerade, waagerecht oder senkrecht. Sie dürfen sich berühren, nicht überlappen.",
        "Die eigene Flotte bleibt für die andere Person verdeckt, bis ein Schiff versenkt ist oder die Runde endet.",
      ],
    },
    {
      title: "Der Beschuss",
      lines: [
        "Sind beide Flotten gesetzt, wird abwechselnd geschossen. Ein Schuss pro Zug.",
        "Wasser wird grau. Ein Treffer wird rot. Ist das Schiff versenkt, werden alle seine Felder grün.",
        "Wer zuerst die ganze gegnerische Flotte versenkt, gewinnt.",
      ],
    },
  ],
  scotland: [
    {
      title: "Die Jagd",
      lines: [
        "Mr. X wird ausgelost. Alle wissen, wer es ist. Niemand sieht, wo. Zu zweit jagt ein Detektiv allein.",
        "Drei Städte: London, Paris und Barcelona. Hinter dem Netz liegt ein Bild der Stadt, Taxi, Bus, U-Bahn und manchmal eine Fähre.",
        "Kurz ist schwer für Mr. X. Er startet in der Mitte, die Detektive auf nahen Feldern. 13 Runden, sichtbar in 3, 8 und 13.",
        "Voll ist leichter für Mr. X. Er startet am Rand, die Detektive weit weg. 22 Runden, sichtbar in 3, 8, 13, 18 und 22.",
        "Jedes Startfeld ist vorgegeben. Mr. X bleibt verdeckt, bis eine Sichtbarkeitsrunde kommt.",
      ],
    },
    {
      title: "Fahrscheine",
      lines: [
        "Detektive: 10 Taxi, 8 Bus, 4 U-Bahn.",
        "Mr. X: 4 Taxi, 3 Bus, 3 U-Bahn, 5 Schwarz, 2 Doppelzüge, 2 Hubschrauber.",
        "Die Fähre fährt nur mit einem schwarzen Fahrschein. Ein Doppelzug sind zwei Fahrten hintereinander und zählt nicht zusammen mit dem Hubschrauber.",
        "Der Hubschrauber fliegt zur nächsten Sehenswürdigkeit dieser Stadt.",
      ],
    },
    {
      title: "Die Ermittlung",
      lines: [
        "Einmal pro Detektivrunde ermittelt die Person, die gerade dran ist. Das Ergebnis sehen die Detektive, Mr. X nicht.",
        "Analyse zeigt, auf welchen Stationen Mr. X noch sein kann. Ortung sagt zu jedem Funkmast, ob er nah, mittel oder fern ist.",
        "Abtasten nennt die Taxischritte bis zum nächsten Funkmast. Befragung fragt die drei Sehenswürdigkeiten der Stadt: hier, vor kurzem oder still.",
      ],
    },
    {
      title: "Treffpunkte und Ende",
      lines: [
        "Mr. X bekommt nach und nach fünf Treffpunkte gezeigt. Nur ein gezeigter Punkt zählt, und nur wenn er während eines Zugs dort landet.",
        "Zwei Treffpunkte gewinnen sofort. Am Ende reicht einer zum Entkommen. Ohne Treffpunkt gewinnen die Detektive.",
        "Steht ein Detektiv auf derselben Station wie Mr. X, ist er gefasst. Kommt Mr. X nicht mehr weg, gewinnen die Detektive ebenfalls.",
      ],
    },
  ],
  uno: [
    {
      title: "Die Karten",
      lines: [
        "Sieben Karten. Die oberste liegt offen und gibt Farbe und Symbol vor.",
        "Du legst eine Karte derselben Farbe oder desselben Symbols. Ein Joker geht immer, du suchst danach die Farbe aus.",
        "Passt nichts, ziehst du eine Karte. Passt sie, darfst du sie legen oder behalten.",
      ],
    },
    {
      title: "Sonderkarten",
      lines: [
        "Aussetzen überspringt die nächste Person. Richtungswechsel dreht die Runde. Zu zweit ist der Richtungswechsel ein Aussetzen.",
        "+2 lässt die nächste Person zwei Karten ziehen. +4 sucht die Farbe und lässt vier ziehen.",
        "+4 darfst du anzweifeln. Hatte die Person die alte Farbe auf der Hand, zieht sie selbst vier. Sonst ziehst du sechs.",
      ],
    },
    {
      title: "Uno und Punkte",
      lines: [
        "Bei einer Karte musst du Uno sagen. Wer es vergisst, kann erwischt werden und zieht zwei.",
        "Wer zuerst nichts mehr hat, bekommt die Punkte der übrigen Karten. Zahlen zählen ihren Wert, Sonderkarten 20, Joker 50.",
        "Kurze Partie bis 100, lange bis 200. Wer das Ziel erreicht oder übersteigt, gewinnt.",
      ],
    },
  ],
  pictionary: [
    {
      title: "Die Runde",
      lines: [
        "Eine Person zeichnet, die anderen raten. Siebzig Sekunden.",
        "Kurz zeichnet jede Person einmal. Mehrere Runden heißt: jede Person zeichnet dreimal. Die Punkte laufen weiter.",
        "Buchstaben, Zahlen und das Wort selbst gehören nicht aufs Blatt.",
      ],
    },
    {
      title: "Wort und Themenbereich",
      lines: [
        "Jede Runde hat einen Themenbereich. Den sehen alle. Das Wort sieht nur, wer den Stift hat.",
        "Wer das Wort nicht kennt, darf es dreimal überspringen und bekommt ein neues. Die Zeit beginnt neu, das alte Wort bleibt geheim.",
        "Wer richtig rät, bekommt 10 Punkte, die zeichnende Person auch. Nach der Runde oder wenn die Zeit um ist, wird das Wort aufgedeckt.",
      ],
    },
  ],
  zehn: [
    {
      title: "Die Karten",
      lines: [
        "Vier Tiere: Hase, Bär, Fuchs und Eule. Zahlen von 1 bis 12, dazu Kuss und Schlaf.",
        "Zehn Karten. Du ziehst eine Karte, vom Stapel oder von der Ablage, und legst am Ende genau eine ab.",
        "Schlaf bleibt auf der Ablage liegen. Legst du Schlaf ab, setzt die nächste Person aus. Zu zweit bist du danach noch einmal dran.",
      ],
    },
    {
      title: "Die Aufgaben",
      lines: [
        "Kurz sind die ersten vier Aufgaben, voll alle zehn.",
        "1 zwei Sätze zu je drei. 2 ein Satz zu drei und eine Reihe zu vier. 3 ein Satz zu vier und eine Reihe zu vier.",
        "4 eine Reihe zu sieben. 5 eine Reihe zu acht. 6 eine Reihe zu neun.",
        "7 zwei Sätze zu je vier. 8 sieben Karten von einem Tier. 9 ein Satz zu fünf und ein Paar. 10 ein Satz zu fünf und eine Reihe zu drei.",
        "Ein Satz sind gleiche Zahlen. Eine Reihe sind aufeinanderfolgende Zahlen. Eine Familie ist ein Tier.",
      ],
    },
    {
      title: "Kuss, Anlegen, Gewinn",
      lines: [
        "Der Kuss ist jede Zahl und jedes Tier. Schlaf gehört in keine Aufgabe.",
        "Liegt deine Aufgabe, darfst du an alle Gruppen auf dem Tisch anlegen. Eine Karte muss zum Ablegen bleiben.",
        "Wer bei der letzten Aufgabe alle Karten los wird, gewinnt. Übrige Karten zählen als Punkte: die Zahl selbst, Schlaf 10, Kuss 15.",
      ],
    },
  ],
  stapel: [
    {
      title: "Die Stapel",
      lines: [
        "Jede Person hat einen verdeckten Liebesstapel. Oben liegt eine Karte offen. Wer ihn leer spielt, gewinnt.",
        "Zu zweit hat der volle Stapel 15 Karten, der kurze 8. Zu dritt 12 und 6, zu viert 10 und 5, zu fünft und sechst 8 und 5.",
        "Vier gemeinsame Baustapel wachsen von 1 bis 12. Bei 12 leert sich der Stapel und fängt wieder bei 1 an.",
      ],
    },
    {
      title: "Der Zug",
      lines: [
        "Zu Beginn füllst du deine Hand auf fünf Karten.",
        "Du baust aus der Hand, von deinen vier Ablagen oder vom Liebesstapel. Es passt nur die nächste Zahl. Der Kuss ist jede Zahl.",
        "Eine Karte aus der Hand auf eine Ablage beendet den Zug. Ist die Hand leer, ziehst du neu und spielst weiter.",
      ],
    },
  ],
  memo: [
    {
      title: "Die Tierchen",
      lines: [
        "Kurz sind acht Paare, voll fünfzehn. Alle Karten liegen verdeckt.",
        "Du deckst zwei Karten auf. Passen sie, gehören sie dir und du bleibst dran.",
        "Passen sie nicht, sehen alle hin. Dann deckst du sie zu und die nächste Person sucht.",
      ],
    },
    {
      title: "Das Ende",
      lines: ["Sind alle Paare gefunden, gewinnen die meisten Paare. Bei Gleichstand gewinnen alle, die vorne liegen."],
    },
  ],
  vier: [
    {
      title: "Das Feld",
      lines: [
        "Zwei Personen, sieben Spalten, sechs Reihen.",
        "Abwechselnd fällt ein Herz in eine Spalte und rutscht nach unten.",
        "Vier gleiche Herzen waagerecht, senkrecht oder schräg gewinnen. Ist alles voll, ohne vier in einer Reihe, endet es unentschieden.",
      ],
    },
  ],
  mau: [
    {
      title: "Die Karten",
      lines: [
        "Hase, Bär, Fuchs und Eule, von 7 bis Ass. Kurz fünf Karten, voll sieben, soweit der Stapel reicht.",
        "Du legst dasselbe Tier oder dieselbe Karte. Passt nichts, ziehst du eine. Passt sie, darfst du sie legen oder behalten.",
        "Wer zuerst nichts mehr auf der Hand hat, gewinnt.",
      ],
    },
    {
      title: "Die Sonderkarten",
      lines: [
        "Der Bube geht immer. Du suchst das nächste Tier aus.",
        "Die 7 lässt die nächste Person zwei Karten ziehen. Eine weitere 7 stapelt und gibt die Pflicht weiter.",
        "Die 8 setzt die nächste Person aus. Das Ass dreht die Richtung. Zu zweit lässt das Ass noch einmal legen.",
      ],
    },
  ],
};
