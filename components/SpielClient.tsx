"use client";

import { gameInfo } from "@/lib/games/catalog";
import type { TablePayload } from "@/lib/payload";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Anleitung } from "./Anleitung";
import { MauBoard } from "./spiele/MauBoard";
import { MemoBoard } from "./spiele/MemoBoard";
import { SchiffeBoard } from "./spiele/SchiffeBoard";
import { ScotlandBoard } from "./spiele/ScotlandBoard";
import { SketchBoard } from "./spiele/SketchBoard";
import { StapelBoard } from "./spiele/StapelBoard";
import { UnoBoard } from "./spiele/UnoBoard";
import { VierBoard } from "./spiele/VierBoard";
import { WizardBoard } from "./spiele/WizardBoard";
import { ZehnBoard } from "./spiele/ZehnBoard";

export function SpielClient({ initial }: { initial: TablePayload }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const info = gameInfo(data.type);

  useEffect(() => {
    let on = true;
    let timer: ReturnType<typeof setTimeout>;
    const delay = data.type === "pictionary" && data.status === "playing" ? 600 : 1200;
    const load = async () => {
      try {
        const res = await fetch(`/api/spiele/${initial.id}`, { cache: "no-store" });
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/";
          return;
        }
        if (res.ok && on) {
          const next = (await res.json()) as TablePayload;
          setData((current) => (next.version < current.version ? current : next));
        }
      } finally {
        if (on) timer = setTimeout(load, delay);
      }
    };
    timer = setTimeout(load, delay);
    return () => {
      on = false;
      clearTimeout(timer);
    };
  }, [initial.id, data.type, data.status]);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/spiele/${data.id}/aktion`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, version: data.version }),
      });
      const json = (await res.json()) as TablePayload & { gone?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Das hat nicht geklappt.");
      if (json.gone) {
        router.push("/");
        return;
      }
      setData((current) => (json.version < current.version ? current : json));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Das hat nicht geklappt.");
      const fresh = await fetch(`/api/spiele/${data.id}`, { cache: "no-store" });
      if (fresh.ok) {
        const next = (await fresh.json()) as TablePayload;
        setData((current) => (next.version < current.version ? current : next));
      }
    } finally {
      setBusy(false);
    }
  }

  const you = data.players.find((player) => player.id === data.you);
  const host = data.hostId === data.you;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker text-gold">{info?.players}</p>
          <h1 className="font-display text-4xl md:text-5xl">{info?.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-display text-3xl tracking-[0.2em]">{data.code}</p>
          <Anleitung id={data.type} />
          {data.status === "playing" ? (
            <button className="btn btn-line" disabled={busy} onClick={() => act({ type: "leave" })}>
              Aufgeben
            </button>
          ) : data.access === "player" && data.status === "lobby" ? (
            <button className="btn btn-line" disabled={busy} onClick={() => act({ type: "leave" })}>
              Zur Startseite
            </button>
          ) : (
            <Link href="/" className="btn btn-line">
              Zur Startseite
            </Link>
          )}
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-cinnabar">
          {error}
        </p>
      ) : null}
      {data.status === "lobby" ? (
        <section className="panel grid gap-6 p-6 md:grid-cols-[1.1fr_.9fr]">
          <div>
            <h2 className="font-display text-3xl">Warten auf die Runde.</h2>
            <ul className="mt-4 space-y-2">
              {data.players.map((player) => (
                <li key={player.id} className="flex items-center justify-between gap-3">
                  <span>
                    {player.name}
                    {player.id === data.hostId ? " · gibt den Tisch" : ""}
                    {player.id === data.you ? " · du" : ""}
                  </span>
                  <span className="text-sm opacity-60">{player.ready ? "sitzt" : "zögert"}</span>
                  {host && player.id !== data.you ? (
                    <button className="btn btn-line" disabled={busy} onClick={() => act({ type: "kick", userId: player.id })}>
                      Weg
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn btn-line" disabled={busy} onClick={() => act({ type: "ready", ready: !you?.ready })}>
                {you?.ready ? "Doch nicht" : "Ich sitze"}
              </button>
              {host ? (
                <button className="btn btn-solid" disabled={busy} onClick={() => act({ type: "start" })}>
                  Runde starten
                </button>
              ) : null}
              <button className="btn btn-line" disabled={busy} onClick={() => act({ type: "leave" })}>
                Aufstehen
              </button>
            </div>
            {host && data.type !== "schiffe" && data.type !== "vier" ? (
              <>
              <div className="mt-4 flex gap-2">
                <button className={`btn ${data.tempo === "kurz" ? "btn-solid" : "btn-line"}`} disabled={busy} onClick={() => act({ type: "options", tempo: "kurz" })}>
                  {data.type === "pictionary" ? "Eine Runde" : "Kurz"}
                </button>
                <button className={`btn ${data.tempo === "voll" ? "btn-solid" : "btn-line"}`} disabled={busy} onClick={() => act({ type: "options", tempo: "voll" })}>
                  {data.type === "pictionary" ? "Mehrere Runden" : "Voll"}
                </button>
              </div>
              {data.type === "scotland" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(
                    [
                      ["london", "London"],
                      ["paris", "Paris"],
                      ["barcelona", "Barcelona"],
                    ] as const
                  ).map(([id, label]) => (
                    <button key={id} className={`btn ${data.city === id ? "btn-solid" : "btn-line"}`} disabled={busy} onClick={() => act({ type: "options", city: id })}>
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
              </>
            ) : null}
            <p className="mt-3 text-sm opacity-60">
              {data.type === "wizard" ? "Kurz sind 6 Runden, voll die ganze Partie." : null}
              {data.type === "uno" ? "Kurz geht bis 100, voll bis 200." : null}
              {data.type === "scotland" ? "London, Paris oder Barcelona. Kurz ist schwer für Mr. X, voll leichter. Die Startfelder sind vorgegeben." : null}
              {data.type === "pictionary" ? "Eine Runde heißt, jede Person zeichnet einmal. Mehrere Runden heißt dreimal." : null}
              {data.type === "zehn" ? "Kurz sind vier Aufgaben, voll alle zehn." : null}
              {data.type === "stapel" ? "Kurz ist der Liebesstapel kleiner, voll größer." : null}
              {data.type === "memo" ? "Kurz sind acht Paare, voll fünfzehn." : null}
              {data.type === "mau" ? "Kurz sind fünf Karten, voll sieben." : null}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-70">Wer den Code {data.code} hat, setzt sich auf der Startseite dazu.</p>
            <details className="mt-4">
              <summary className="cursor-pointer">Regeln</summary>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {info?.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </details>
          </div>
        </section>
      ) : null}
      {data.view?.kind === "schiffe" ? <SchiffeBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "wizard" ? <WizardBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "uno" ? <UnoBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "scotland" ? <ScotlandBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "pictionary" ? <SketchBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "zehn" ? <ZehnBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "stapel" ? <StapelBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "memo" ? <MemoBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "vier" ? <VierBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "mau" ? <MauBoard view={data.view} busy={busy} onAction={act} /> : null}
    </div>
  );
}
