"use client";

import Link from "next/link";
import { useState } from "react";

export function Bestaetigen({ token, email }: { token: string; email: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [address, setAddress] = useState(email);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    const res = await fetch("/api/auth/bestaetigen", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const json = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) setMessage(json.error ?? "Das hat nicht geklappt.");
    else {
      setOk(true);
      setMessage("Die Adresse gehört dir. Du kannst dich anmelden.");
    }
  }

  async function resend(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const res = await fetch("/api/auth/erneut", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: address }),
    });
    const json = (await res.json()) as { error?: string; devLink?: string | null };
    setBusy(false);
    if (!res.ok) setMessage(json.error ?? "Die Mail ist nicht raus.");
    else {
      setMessage("Die Mail ist noch einmal unterwegs.");
      setDevLink(json.devLink ?? null);
    }
  }

  return (
    <main className="wrap grid min-h-dvh items-center py-12 md:grid-cols-2">
      <div>
        <Link href="/" className="font-display text-2xl">
          Tafelrunde
        </Link>
        <h1 className="font-display mt-8 text-5xl">Ist das deine Mail?</h1>
        <p className="mt-4 max-w-sm text-paper/75">Der Link allein bestätigt nichts. Ein Klick hier schon, damit kein fremder Scanner ihn verbraucht.</p>
      </div>
      <div className="panel mt-8 space-y-5 p-7">
        {token ? (
          <button className="btn btn-solid" onClick={confirm} disabled={busy || ok}>
            Ja, das bin ich
          </button>
        ) : (
          <p>In der Mail fehlt der Schlüssel. Lass sie dir noch einmal schicken.</p>
        )}
        {message ? <p role="alert">{message}</p> : null}
        {ok ? (
          <Link className="btn btn-line" href="/anmelden">
            Zum Anmelden
          </Link>
        ) : null}
        {devLink ? (
          <a className="block underline" href={devLink}>
            Neuen Link öffnen
          </a>
        ) : null}
        <form onSubmit={resend} className="space-y-3 border-t border-ink/10 pt-4">
          <label>
            Mail nochmal schicken
            <input className="field" type="email" value={address} onChange={(event) => setAddress(event.target.value)} required />
          </label>
          <button className="btn btn-line" disabled={busy}>
            Senden
          </button>
        </form>
      </div>
    </main>
  );
}
