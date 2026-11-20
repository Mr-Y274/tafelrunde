import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nutzung · Tafelrunde",
};

export default function NutzungPage() {
  return (
    <main className="wrap py-10">
      <Link href="/eingang" className="font-display text-[22px] font-bold tracking-tight">
        Tafelrunde
      </Link>
      <p className="kicker mt-8 text-gold">Nutzung</p>
      <h1 className="title mt-3">Hausregeln für den Kreis</h1>
      <div className="copy mt-6 max-w-2xl space-y-4 text-paper/80">
        <p>
          Tafelrunde ist ein privates, unentgeltliches Spiel von Max Ritschel für einen eingeladenen Kreis. Es ist
          kein Laden, kein Verein und kein Angebot an die Öffentlichkeit. Der Zugangscode bleibt im Kreis.
        </p>
        <h2 className="font-display text-[22px] font-bold tracking-tight text-paper">Am Tisch</h2>
        <p>
          Gezeichnet und geraten wird so, dass niemand verletzt, bedroht oder bloßgestellt wird. Nichts Rechtswidriges,
          keine Daten anderer Leute, keine Werbung. Wer den Tisch verlässt, gibt den Platz frei. Die gastgebende
          Person startet die Runde.
        </p>
        <h2 className="font-display text-[22px] font-bold tracking-tight text-paper">Die Spiele</h2>
        <p>
          Die Partien sind eigene Umsetzungen für diesen Tisch. Es werden keine Spielbretter, Kartenbilder oder
          Regeltexte der Verlage verwendet. Wizard, Uno, Scotland Yard, Pictionary, Phase 10, Skip-Bo und Vier
          gewinnt sind bekannte Spiele und, soweit geschützt, Marken ihrer Inhaber. Tafelrunde steht mit diesen
          Verlagen in keiner Verbindung. Die Namen stehen hier nur, damit der Kreis das Spiel wiedererkennt.
          Schiffe versenken und Memo heißen hier so. Die Bretter von London, Paris und Barcelona sind eigene Zeichnungen für diesen Tisch.
        </p>
        <h2 className="font-display text-[22px] font-bold tracking-tight text-paper">Wenn etwas hakt</h2>
        <p>
          Die Seite kann pausieren, einen Stand verlieren oder sich ändern. Dafür gibt es kein Entgelt und keine
          Zusage, dass eine Partie zu Ende spielbar bleibt. Für Vorsatz und grobe Fahrlässigkeit sowie für Schäden an
          Leben, Körper und Gesundheit bleibt es bei der gesetzlichen Haftung. Im Übrigen haftet ein unentgeltliches
          privates Spiel nur in den Grenzen, die das Gesetz für eine Schenkung zieht.
        </p>
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland. Mehr zu den Daten steht in der{" "}
          <Link className="underline" href="/datenschutz">Datenschutzerklärung</Link>, die Angaben zur Person im{" "}
          <Link className="underline" href="/impressum">Impressum</Link>.
        </p>
      </div>
    </main>
  );
}
