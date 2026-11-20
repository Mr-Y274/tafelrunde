"use client";

import { CATALOG } from "@/lib/games/catalog";
import type { TischData } from "@/lib/payload";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Anleitung } from "./Anleitung";
import { NamenWahl } from "./NamenWahl";

export function TischApp({ initial }: { initial: TischData }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    let on = true;
    const tick = async () => {
      const res = await fetch("/api/tisch", { cache: "no-store" });
      if (res.ok && on) setData((await res.json()) as TischData);
    };
    void tick();
    const timer = setInterval(tick, 8000);
    return () => {
      on = false;
      clearInterval(timer);
    };
  }, []);

  async function openGame(type: string) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/spiele", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const json = (await res.json()) as { id?: string; error?: string };
    setBusy(false);
    if (!res.ok || !json.id) setError(json.error ?? "Der Tisch bleibt zu.");
    else router.push(`/spiel/${json.id}`);
  }

  async function join(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/spiele/beitreten", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const json = (await res.json()) as { id?: string; error?: string };
    setBusy(false);
    if (!res.ok || !json.id) setError(json.error ?? "Der Code passt nicht.");
    else router.push(`/spiel/${json.id}`);
  }

  return (
    <div className="space-y-6">
      <section className="row-in py-2 md:grid md:grid-cols-[1.2fr_.8fr] md:items-end md:gap-10">
        <h1 className="title">Der Code reicht.</h1>
        <p className="copy mt-4 text-paper/80 md:mt-0">Kein Account. Such dir einen Namen aus. Der bleibt weg, solange du da bist. Den Tischcode gibst du weiter.</p>
      </section>
      <NamenWahl>
      <form onSubmit={join} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5">
        <label className="min-w-0 flex-1">
          Tischcode
          <input className="field uppercase" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} maxLength={6} autoCapitalize="characters" autoCorrect="off" enterKeyHint="go" required />
        </label>
        <button className="btn btn-solid w-full sm:w-auto" disabled={busy}>
          Dazusetzen
        </button>
      </form>
      {error ? (
        <p role="alert" className="text-cinnabar">
          {error}
        </p>
      ) : null}
      <div className="panel p-5">
          <h2 className="font-display text-[22px] font-bold tracking-tight">Ein Spiel aufmachen</h2>
        <ul className="mt-3 divide-y divide-ink/10 md:grid md:grid-cols-2 md:gap-x-10 md:divide-y-0">
          {CATALOG.map((game) => (
            <li key={game.id} className="row-in flex flex-col gap-3 border-ink/10 py-4 md:flex-row md:items-center md:justify-between md:border-b">
              <div className="min-w-0">
                <p className="font-display text-[22px] font-bold tracking-tight">{game.name}</p>
                <p className="copy opacity-70">
                  {game.players} · {game.blurb}
                </p>
              </div>
              <div className="flex gap-2">
                <Anleitung id={game.id} />
                <button className="btn btn-solid flex-1 sm:flex-none" disabled={busy} onClick={() => openGame(game.id)}>
                  Tisch
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {data.tables.length > 0 ? (
        <div>
          <h2 className="font-display text-[22px] font-bold tracking-tight">Deine Tische</h2>
          <ul className="mt-2">
            {data.tables.map((table) => (
              <li key={table.id}>
                <button className="flex w-full items-baseline justify-between gap-3 py-2 text-left" onClick={() => router.push(`/spiel/${table.id}`)}>
                  <span>{CATALOG.find((game) => game.id === table.type)?.name}</span>
                  <span className="text-sm text-paper/60">
                    {table.seats} {table.seats === 1 ? "Platz" : "Plätze"} · {table.code}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      </NamenWahl>
    </div>
  );
}
