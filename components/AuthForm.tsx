"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const register = mode === "register";
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setDevLink(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const username = String(form.get("username") ?? "");
    const again = String(form.get("again") ?? "");
    if (register && password !== again) {
      setError("Die Passwörter sind nicht gleich.");
      return;
    }
    setBusy(true);
    const res = await fetch(register ? "/api/auth/registrieren" : "/api/auth/anmelden", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(register ? { username, email, password } : { email, password }),
    });
    const json = (await res.json()) as { error?: string; code?: string; devLink?: string | null };
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Das hat nicht geklappt.");
      if (json.code === "unverified") setUnverifiedEmail(email);
      return;
    }
    if (register) {
      setNotice("Schau in dein Postfach und bestätige die Adresse. Danach kannst du dich anmelden.");
      setDevLink(json.devLink ?? null);
      return;
    }
    router.push("/tisch");
    router.refresh();
  }

  async function resend() {
    if (!unverifiedEmail) return;
    setBusy(true);
    const res = await fetch("/api/auth/erneut", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: unverifiedEmail }),
    });
    const json = (await res.json()) as { error?: string; devLink?: string | null };
    setBusy(false);
    if (!res.ok) setError(json.error ?? "Die Mail ist nicht raus.");
    else {
      setNotice("Die Mail ist noch einmal unterwegs.");
      setDevLink(json.devLink ?? null);
    }
  }

  return (
    <main className="wrap grid min-h-dvh items-center py-10 md:grid-cols-2">
      <div>
        <Link href="/" className="font-display text-2xl">
          Tafelrunde
        </Link>
        <h1 className="font-display mt-8 text-5xl leading-tight">{register ? "Einen Platz nehmen." : "Wieder da."}</h1>
        <p className="mt-4 max-w-sm text-paper/75">
          {register
            ? "Name, Mail, Passwort. Die Mail muss bestätigt sein, bevor du dich an den Tisch setzt."
            : "Melde dich mit der bestätigten Mail an."}
        </p>
      </div>
      <form onSubmit={onSubmit} className="panel mt-10 space-y-5 p-7 md:mt-0">
        {register ? (
          <label>
            Benutzername
            <input className="field" name="username" autoComplete="username" required minLength={3} maxLength={20} pattern="[A-Za-z0-9_-]{3,20}" />
          </label>
        ) : null}
        <label>
          Mail
          <input className="field" name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Passwort
          <input className="field" name="password" type="password" autoComplete={register ? "new-password" : "current-password"} required minLength={8} maxLength={72} />
        </label>
        {register ? (
          <label>
            Passwort wiederholen
            <input className="field" name="again" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
          </label>
        ) : null}
        {error ? (
          <p role="alert" className="text-cinnabar">
            {error}
          </p>
        ) : null}
        {notice ? <p className="text-moss">{notice}</p> : null}
        {devLink ? (
          <p>
            <a className="underline" href={devLink}>
              Bestätigungslink öffnen
            </a>
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3 pt-2">
          <button className="btn btn-solid" disabled={busy}>
            {register ? "Account anlegen" : "Anmelden"}
          </button>
          {unverifiedEmail ? (
            <button type="button" className="btn btn-line" onClick={resend} disabled={busy}>
              Mail nochmal schicken
            </button>
          ) : null}
        </div>
        <p className="flex flex-col gap-2 text-sm opacity-70">
          {register ? (
            <Link href="/anmelden">Ich habe schon einen Platz.</Link>
          ) : (
            <>
              <Link href="/passwort">Passwort vergessen</Link>
              <Link href="/registrieren">Ich brauche einen Account.</Link>
            </>
          )}
        </p>
      </form>
    </main>
  );
}
