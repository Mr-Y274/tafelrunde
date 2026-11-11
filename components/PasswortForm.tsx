"use client";

import Link from "next/link";
import { useState } from "react";

export function PasswortForm() {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setBusy(true);
    const res = await fetch("/api/auth/passwort", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) setError(json.error ?? "Die Mail ist nicht raus.");
    else setNotice("Wenn zu der Adresse ein Account gehört, ist der Link unterwegs. Er gilt eine Stunde.");
  }

  return (
    <main className="wrap grid min-h-dvh items-center py-10 md:grid-cols-2">
      <div>
        <Link href="/" className="font-display text-2xl">
          Tafelrunde
        </Link>
        <h1 className="font-display mt-8 text-5xl leading-tight">Passwort vergessen.</h1>
        <p className="mt-4 max-w-sm text-paper/75">Wir schicken einen Link an die Mail des Accounts. Danach setzt du ein neues Passwort.</p>
      </div>
      <form onSubmit={onSubmit} className="panel mt-10 space-y-5 p-7 md:mt-0">
        <label>
          Mail
          <input className="field" name="email" type="email" autoComplete="email" required />
        </label>
        {error ? (
          <p role="alert" className="text-cinnabar">
            {error}
          </p>
        ) : null}
        {notice ? <p className="text-moss">{notice}</p> : null}
        <button className="btn btn-solid" disabled={busy}>
          Link schicken
        </button>
        <p className="text-sm opacity-70">
          <Link href="/anmelden">Zurück zum Anmelden</Link>
        </p>
      </form>
    </main>
  );
}
