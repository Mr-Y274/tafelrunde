"use client";

import { useState } from "react";

export function EingangForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/eingang", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const json = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setBusy(false);
      setError(json?.error ?? "Der Code stimmt nicht.");
      return;
    }
    window.location.assign("/");
  }

  return (
    <form className="mt-8 max-w-sm" onSubmit={submit}>
      <label className="block">
        <span className="kicker text-gold">Zugangscode</span>
        <input
          className="mt-3 w-full rounded-2xl border border-paper/20 bg-ink/40 px-4 py-3 text-2xl tracking-[0.4em] text-paper"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          pattern="[0-9]{4}"
          required
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
        />
      </label>
      {error ? <p className="mt-3 text-cinnabar">{error}</p> : null}
      <button className="btn btn-solid mt-5" type="submit" disabled={busy || code.length !== 4}>
        Eintreten
      </button>
    </form>
  );
}
