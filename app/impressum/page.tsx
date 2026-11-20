import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum · Tafelrunde",
};

export default function ImpressumPage() {
  return (
    <main className="wrap py-10">
      <Link href="/" className="font-display text-[22px] font-bold tracking-tight">
        Tafelrunde
      </Link>
      <p className="kicker mt-8 text-gold">Impressum</p>
      <h1 className="title mt-3">Angaben gemäß § 5 DDG</h1>
      <div className="copy mt-6 max-w-2xl space-y-4 text-paper/80">
        <p>
          Max Ritschel
          <br />
          Oppspring 67
          <br />
          45470 Mülheim an der Ruhr
          <br />
          E-Mail: <a className="underline" href="mailto:max.ritschel@gmx.de">max.ritschel@gmx.de</a>
        </p>
        <p>Verantwortlich für den Inhalt: Max Ritschel, Anschrift wie oben.</p>
        <p>Tafelrunde ist ein privates Spiel für den eigenen Kreis und kein gewerbliches Angebot.</p>
        <p>
          An einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle nimmt Max Ritschel nicht teil
          und ist dazu nicht verpflichtet.
        </p>
        <p>
          <Link className="underline" href="/datenschutz">
            Datenschutz
          </Link>
          {" · "}
          <Link className="underline" href="/nutzung">
            Nutzung
          </Link>
        </p>
      </div>
    </main>
  );
}
