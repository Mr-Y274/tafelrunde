import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutz · Tafelrunde",
};

export default function DatenschutzPage() {
  return (
    <main className="wrap py-10">
      <Link href="/eingang" className="font-display text-2xl">
        Tafelrunde
      </Link>
      <p className="kicker mt-12 text-gold">Datenschutz</p>
      <h1 className="font-display mt-3 text-5xl">Was diese Seite speichert</h1>
      <div className="mt-8 max-w-2xl space-y-6 text-paper/80">
        <p>
          Verantwortlich ist Max Ritschel, Oppspring 67, 45470 Mülheim an der Ruhr,{" "}
          <a className="underline" href="mailto:max.ritschel@gmx.de">
            max.ritschel@gmx.de
          </a>
          . Es gibt keine Datenschutzbeauftragte und keinen Datenschutzbeauftragten. Die Seite ist ein privates Spiel
          für einen geschlossenen Kreis, kein Gewerbe.
        </p>
        <h2 className="font-display text-3xl text-paper">Zugang</h2>
        <p>
          Ohne den vierstelligen Code bleibt die Seite zu. Stimmt der Code, legt der Browser ein notwendiges Cookie
          namens <span className="text-paper">tr_eingang</span> an. Darin steht kein Code, sondern nur ein Nachweis,
          dass diese Tür schon aufging. Das Cookie ist für andere Seiten unsichtbar, gilt 30 Tage und dient allein
          dazu, den Kreis geschlossen zu halten. Rechtsgrundlage ist Artikel 6 Absatz 1 Buchstabe f DSGVO.
        </p>
        <h2 className="font-display text-3xl text-paper">Am Tisch</h2>
        <p>
          Es gibt keine Konten, keine Namen aus dem echten Leben und keine E-Mail-Adresse, die du einträgst. Beim
          ersten Platz setzt die Seite ein zweites notwendiges Cookie, <span className="text-paper">tr_guest</span>.
          Es enthält ein zufälliges Kennzeichen, damit derselbe Browser denselben Platz behält. Auf dem Server liegt
          dazu ein zufälliger Kosename aus dem Liebesthema, der Spielstand, Züge, geratene Wörter und bei Pictionary
          die Zeichnung. Rechtsgrundlage ist Artikel 6 Absatz 1 Buchstabe b DSGVO, weil du das Spiel ausdrücklich
          benutzt.
        </p>
        <p>
          Schreibe in Zeichnungen und Rateversuche keine echten Namen, Adressen oder Geheimnisse. Was dort steht,
          sehen die Leute am Tisch und bleibt im Spielstand gespeichert.
        </p>
        <h2 className="font-display text-3xl text-paper">Wie lange</h2>
        <p>
          Beide Cookies liegen 30 Tage im Browser. Eine leere Lobby wird gelöscht, sobald die letzte Person aufsteht.
          Laufende und beendete Partien bleiben gespeichert, bis sie entfernt werden. Auf eine Nachricht an die oben
          genannte Adresse hin werden der Platz und die zugehörigen Partien gelöscht.
        </p>
        <h2 className="font-display text-3xl text-paper">Wer sonst noch mithilft</h2>
        <p>
          Die Seite läuft bei Vercel. Dabei können Verbindungsdaten anfallen, also IP-Adresse, Zeitpunkt und
          Browsertyp, damit die Seite ausgeliefert wird und Missbrauch erkennbar bleibt. Die Spieldaten liegen bei
          Neon in Frankfurt. Beide sind Auftragsverarbeiter. Es gibt keine Werbung, keine Reichweitenmessung und
          keine Weitergabe an andere. Die Schriften werden mit der Seite ausgeliefert. Beim Spielen ruft der Browser
          dafür keine fremde Schriftseite auf.
        </p>
        <h2 className="font-display text-3xl text-paper">Deine Rechte</h2>
        <p>
          Du kannst Auskunft, Berichtigung, Löschung, Einschränkung und eine Kopie der Daten verlangen, soweit sie
          dich betreffen, und der Speicherung aus berechtigtem Interesse widersprechen. Eine Einwilligung ist hier
          nicht die Grundlage. Beschweren kannst du dich bei der Landesbeauftragten für Datenschutz und
          Informationsfreiheit Nordrhein-Westfalen, Kavalleriestraße 2–4, 40213 Düsseldorf.
        </p>
        <p>
          Die Cookies sind für den Zugang und den Platz am Tisch erforderlich. Deshalb gibt es kein extra
          Einwilligungsfenster. Mehr zum Kreis steht in der <Link className="underline" href="/nutzung">Nutzung</Link>{" "}
          und im <Link className="underline" href="/impressum">Impressum</Link>.
        </p>
      </div>
    </main>
  );
}
