"use client";

import Link from "next/link";
import { useState } from "react";

export function NeuesPasswort({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const again = String(form.get("again") ?? "");
    if (password !== again) {
      setError("Die Passwörter sind nicht gleich.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/passwort/neu", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const json = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) setError(json.error ?? "Das hat nicht geklappt.");
    else setOk(true);
  }

  return (
    <main className="wrap grid min-h-dvh items-center py-10 md:grid-cols-2">
      <div>
        <Link href="/" className="font-display text-2xl">
          Tafelrunde
        </Link>
        <h1 className="font-display mt-8 text-5xl leading-tight">Neues Passwort.</h1>
        <p className="mt-4 max-w-sm text-paper/75">Acht Zeichen reichen. Danach meldest du dich damit an.</p>
      </div>
      <div className="panel mt-10 space-y-5 p-7 md:mt-0">
        {token && !ok ? (
          <form onSubmit={onSubmit} className="space-y-5">
            <label>
              Neues Passwort
              <input className="field" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
            </label>
            <label>
              Passwort wiederholen
              <input className="field" name="again" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
            </label>
            {error ? (
              <p role="alert" className="text-cinnabar">
                {error}
              </p>
            ) : null}
            <button className="btn btn-solid" disabled={busy}>
              Passwort speichern
            </button>
          </form>
        ) : null}
        {!token ? <p role="alert">In der Mail fehlt der Schlüssel. Lass dir den Link noch einmal schicken.</p> : null}
        {ok ? <p className="text-moss">Das Passwort ist neu. Du kannst dich anmelden.</p> : null}
        <p className="text-sm opacity-70">
          <Link href={ok ? "/anmelden" : "/passwort"}>{ok ? "Zum Anmelden" : "Link nochmal anfordern"}</Link>
        </p>
      </div>
    </main>
  );
}
