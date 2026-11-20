import type { GameId } from "./types";

export type GuideSection = { title: string; lines: string[] };

export const GUIDES: Record<GameId, GuideSection[]> = {
  wizard: [
    {
      title: "Die Runde",
      lines: [
        "Kurz sind 6 Runden. Voll geht so lange, bis der Stapel leer ist. Zu zweit sind das 30 Runden mit dem Farbblatt und 20 mit dem Skatblatt.",
        "Das Farbblatt hat Rot, Gelb, Grün und Blau, jeweils von 1 bis 13. Das Skatblatt hat Kreuz, Pik, Herz und Karo, von 7 bis Ass. Beide haben vier Zauberer und vier Narren.",
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
        "Mr. X wird ausgelost. Alle wissen, wer es ist. Niemand sieht, wo er steht.",
        "London, Paris oder Barcelona. Jede Karte hat 199 Stationen. Gelb ist Taxi, Grün der Bus, Rot die U-Bahn, Schwarz gestrichelt die Fähre.",
        "Die Startfelder werden gezogen. Keine zwei Figuren beginnen auf derselben Station.",
        "Das Spiel dauert 24 Züge von Mr. X. Er zieht immer zuerst, danach die Detektive der Reihe nach. Fehlen Figuren bis drei, spielt sie der Detektiv mit.",
      ],
    },
    {
      title: "Fahrscheine",
      lines: [
        "Jeder Detektiv beginnt mit 10 Taxi, 8 Bus und 4 U-Bahn. Das benutzte Ticket bekommt Mr. X.",
        "Mr. X beginnt mit 4 Taxi, 3 Bus, 3 U-Bahn und 2 Doppelzügen. Schwarz gibt es so viele, wie Detektive mitspielen.",
        "Schwarz darf jedes Verkehrsmittel nehmen, auch die Fähre. Die Detektive sehen dann nur Schwarz, nicht womit er gefahren ist.",
        "Ein Doppelzug sind zwei Fahrten hintereinander. Dafür verbraucht er zwei Tickets und zwei Runden.",
      ],
    },
    {
      title: "Das Fahrtenbuch",
      lines: [
        "In den Runden 3, 8, 13, 18 und 24 zeigt Mr. X seine Station. Dazwischen bleibt ein Ring auf der letzten sichtbaren Station.",
        "In allen anderen Runden steht im Fahrtenbuch nur das Ticket: Taxi, Bus, U-Bahn oder Schwarz.",
      ],
    },
    {
      title: "Das Ende",
      lines: [
        "Detektive dürfen nicht auf derselben Station stehen. Wer nicht mehr fahren kann, setzt aus.",
        "Die Detektive gewinnen, sobald eine Figur auf der Station von Mr. X steht.",
        "Mr. X gewinnt nach Zug 24 oder wenn sich kein Detektiv mehr bewegen kann.",
      ],
    },
  ],
  uno: [
    {
      title: "Die Karten",
      lines: [
        "Sieben Karten. Die oberste liegt offen und gibt Farbe und Symbol vor.",
        "Du legst eine Karte derselben Farbe oder desselben Symbols. Rainbow geht immer, du suchst danach die Farbe aus.",
        "Passt nichts, ziehst du eine Karte. Passt sie, darfst du sie legen oder behalten.",
      ],
    },
    {
      title: "Sonderkarten",
      lines: [
        "Aussetzen überspringt die nächste Person. Richtungswechsel dreht die Runde. Zu zweit ist der Richtungswechsel ein Aussetzen.",
        "+2 lässt sich auf jede +2 legen, egal welche Farbe. Die nächste Person zieht die Summe oder legt selbst eine +2. +4 sucht die Farbe und lässt vier ziehen.",
        "+4 darfst du anzweifeln. Hatte die Person die alte Farbe auf der Hand, zieht sie selbst vier. Sonst ziehst du sechs.",
      ],
    },
    {
      title: "Uno und Punkte",
      lines: [
        "Bei einer Karte musst du Uno sagen. Wer es vergisst, kann erwischt werden und zieht zwei.",
        "Wer zuerst nichts mehr hat, bekommt die Punkte der übrigen Karten. Zahlen zählen ihren Wert, Sonderkarten 20, Rainbow und +4 je 50.",
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
        "Vier Farben: Rot, Gelb, Grün und Blau. Von jeder Zahl 1 bis 12 gibt es zwei Karten, dazu acht Wild und vier Skip.",
        "Zehn Karten. Du ziehst eine Karte, vom Stapel oder von der Ablage, und legst am Ende genau eine ab.",
        "Skip bleibt auf der Ablage liegen. Legst du Skip ab, setzt die nächste Person aus. Zu zweit bist du danach noch einmal dran.",
      ],
    },
    {
      title: "Die Aufgaben",
      lines: [
        "Kurz sind die ersten vier Aufgaben, voll alle zehn.",
        "1 zwei Sätze zu je drei. 2 ein Satz zu drei und eine Reihe zu vier. 3 ein Satz zu vier und eine Reihe zu vier.",
        "4 eine Reihe zu sieben. 5 eine Reihe zu acht. 6 eine Reihe zu neun.",
        "7 zwei Sätze zu je vier. 8 sieben Karten einer Farbe. 9 ein Satz zu fünf und ein Paar. 10 ein Satz zu fünf und eine Reihe zu drei.",
        "Ein Satz sind gleiche Zahlen. Eine Reihe sind aufeinanderfolgende Zahlen. Eine Farbe sind Karten derselben Farbe.",
      ],
    },
    {
      title: "Wild, Anlegen, Gewinn",
      lines: [
        "Wild ist jede Zahl und jede Farbe. Skip gehört in keine Aufgabe.",
        "Liegt deine Aufgabe, darfst du an alle Gruppen auf dem Tisch anlegen. Eine Karte muss zum Ablegen bleiben.",
        "Wer bei der letzten Aufgabe alle Karten los wird, gewinnt. Übrige Karten zählen als Punkte: 1 bis 9 die Zahl, 10 bis 12 je 10, Skip 15, Wild 25.",
      ],
    },
  ],
  stapel: [
    {
      title: "Die Stapel",
      lines: [
        "Jede Person hat einen verdeckten Vorrat. Oben liegt eine Karte offen. Wer ihn leer spielt, gewinnt.",
        "Der Vorrat hat 10, 20 oder 30 Karten. Zu sechst passen 30 nicht. Auf jeder Ablage sieht man, wie viele Karten liegen und welche, von unten nach oben.",
        "Vier gemeinsame Baustapel wachsen von 1 bis 12. Bei 12 wird der Stapel weggeräumt und beginnt wieder bei 1.",
      ],
    },
    {
      title: "Der Zug",
      lines: [
        "Zu Beginn füllst du deine Hand auf fünf Karten.",
        "Du baust aus der Hand, von deinen vier Ablagen oder vom Vorrat. Es passt nur die nächste Zahl. Skip-Bo ist jede Zahl.",
        "Eine Karte aus der Hand auf eine Ablage beendet den Zug. Ist die Hand leer, ziehst du fünf neue und spielst weiter.",
      ],
    },
  ],
  memo: [
    {
      title: "Die Tierchen",
      lines: [
        "Das Feld hat 12, 20 oder 30 Kacheln. Alle liegen verdeckt.",
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
        "Zwei bis vier Personen. Das Feld ist 6×5, 7×6 oder 9×7.",
        "Reihum fällt ein Herz in eine Spalte und rutscht nach unten. Der letzte Stein ist lila umrandet.",
        "Vier gleiche Herzen waagerecht, senkrecht oder schräg gewinnen. Ist alles voll, ohne vier in einer Reihe, endet es unentschieden.",
      ],
    },
  ],
  risko: [
    {
      title: "Das Brett",
      lines: [
        "2 bis 6 Personen. Nordamerika 5, Südamerika 2, Europa 5, Afrika 3, Asien 7, Australien 2 Extraarmeen, wenn du den Kontinent ganz hältst.",
        "Zu zweit 40 Armeen, zu dritt 35, zu viert 30, zu fünft 25, zu sechst 20. Auf jedem der 42 Gebiete liegt zuerst eine Armee. Den Rest setzt ihr reihum.",
        "Gestrichelte Linien sind Seewege und zählen wie eine Grenze.",
      ],
    },
    {
      title: "Die drei Phasen",
      lines: [
        "Verstärken: mindestens 3 Armeen, sonst ein Drittel deiner Gebiete, plus Kontinentbonus. Drei gleiche Symbole oder je eines tauschen 4, 6, 8, 10, 12, 15 und danach je 5 weitere. Ab fünf Karten ist der Tausch Pflicht. Ein eigenes Gebiet aus dem Satz bekommt 2 Armeen direkt.",
        "Angreifen: vom eigenen Gebiet mit mindestens 2 Armeen auf ein benachbartes fremdes. 1 bis 3 Würfel gegen 1 oder 2. Die höchsten Paare vergleichen sich. Bei Gleichstand bleibt das Gebiet bei der Verteidigung. Danach ziehst du mindestens so viele Armeen nach, wie du Würfel benutzt hast.",
        "Eroberst du mindestens ein Gebiet, ziehst du am Ende des Angriffs genau eine Karte. Verschieben darfst du danach einmal, über eigene verbundene Gebiete. Eine Armee bleibt immer zurück.",
      ],
    },
    {
      title: "Das Ende",
      lines: [
        "Geheimaufträge: 24 Gebiete, 18 Gebiete mit je 2 Armeen, zwei Kontinente, oder alle Armeen einer Farbe. Ist die Farbe deine eigene oder schon weg, gilt stattdessen: 24 Gebiete.",
        "Welteroberung gewinnt, wer alle 42 Gebiete hält. Wer allein übrig ist, gewinnt sofort.",
      ],
    },
  ],
};
