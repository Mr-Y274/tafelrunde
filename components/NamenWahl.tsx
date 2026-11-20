"use client";

import { useEffect, useState } from "react";

type Offer = { name: string | null; names: string[] };

export function NamenWahl({ children }: { children: React.ReactNode }) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let on = true;
    const load = async () => {
      const res = await fetch("/api/namen", { cache: "no-store" });
      if (!res.ok || !on) return;
      setOffer((await res.json()) as Offer);
    };
    void load();
    const timer = setInterval(() => void load(), 20000);
    return () => {
      on = false;
      clearInterval(timer);
    };
  }, []);

  async function pick(name: string) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/namen", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = (await res.json()) as Offer & { error?: string };
    setBusy(false);
    if (!res.ok || !json.name) {
      setError(json.error ?? "Der Name ist gerade vergeben.");
      if (json.names) setOffer({ name: null, names: json.names });
      return;
    }
    setOffer({ name: json.name, names: json.names ?? [] });
  }

  if (offer?.name) return <>{children}</>;

  return (
    <section className="panel p-4 sm:p-6">
      <h2 className="font-display text-[28px] font-bold tracking-tight">Such dir einen Namen.</h2>
      <p className="copy mt-2">Er verschwindet aus der Liste, solange du hier bist.</p>
      {offer == null ? <p className="mt-4">Die Namen kommen.</p> : null}
      {offer && offer.names.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {offer.names.map((name) => (
            <button key={name} className="btn btn-line" disabled={busy} onClick={() => pick(name)}>
              {name}
            </button>
          ))}
        </div>
      ) : null}
      {offer && offer.names.length === 0 ? <p className="mt-4">Gerade sind alle Namen vergeben.</p> : null}
      {error ? (
        <p role="alert" className="mt-3 text-cinnabar">
          {error}
        </p>
      ) : null}
    </section>
  );
}
