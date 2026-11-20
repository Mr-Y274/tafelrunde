"use client";

import { gameInfo } from "@/lib/games/catalog";
import { BOT_NAME } from "@/lib/games/bot-id";
import type { TablePayload } from "@/lib/payload";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Anleitung } from "./Anleitung";
import { NamenWahl } from "./NamenWahl";
import { ZoomFeld } from "./ZoomFeld";
import { MemoBoard } from "./spiele/MemoBoard";
import { RiskoBoard } from "./spiele/RiskoBoard";
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
    <NamenWahl>
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="kicker text-gold">{info?.players}</p>
          <h1 className="title mt-1">{info?.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[22px] font-bold tracking-tight whitespace-nowrap">{data.code}</p>
          <Anleitung id={data.type} />
          {data.status === "finished" ? (
            <button className="btn btn-solid" disabled={busy} onClick={() => act({ type: "again" })}>
              Noch eine Runde
            </button>
          ) : null}
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
        <section className="panel grid min-w-0 gap-6 p-4 sm:p-6 md:grid-cols-[1.1fr_.9fr]">
          <div>
            <h2 className="font-display text-[22px] font-bold tracking-tight">Warten auf die Runde.</h2>
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
            {host && data.type === "memo" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    [6, "12 Kacheln"],
                    [10, "20 Kacheln"],
                    [15, "30 Kacheln"],
                  ] as const
                ).map(([pairs, label]) => (
                  <button key={pairs} className={`btn ${data.memo === pairs ? "btn-solid" : "btn-line"}`} disabled={busy} onClick={() => act({ type: "options", memo: pairs })}>
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            {host && data.type === "stapel" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {([10, 20, 30] as const).map((size) => (
                  <button key={size} className={`btn ${data.vorrat === size ? "btn-solid" : "btn-line"}`} disabled={busy} onClick={() => act({ type: "options", vorrat: size })}>
                    {size} Karten
                  </button>
                ))}
              </div>
            ) : null}
            {host && data.type === "vier" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    ["klein", "6 × 5"],
                    ["mittel", "7 × 6"],
                    ["gross", "9 × 7"],
                  ] as const
                ).map(([id, label]) => (
                  <button key={id} className={`btn ${data.vier === id ? "btn-solid" : "btn-line"}`} disabled={busy} onClick={() => act({ type: "options", vier: id })}>
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            {host && data.type !== "schiffe" && data.type !== "vier" && data.type !== "memo" && data.type !== "stapel" ? (
              <>
              {data.type !== "scotland" ? <div className="mt-4 flex gap-2">
                <button className={`btn ${data.tempo === "kurz" ? "btn-solid" : "btn-line"}`} disabled={busy} onClick={() => act({ type: "options", tempo: "kurz" })}>
                  {data.type === "risko" ? "Geheimaufträge" : data.type === "pictionary" ? "Eine Runde" : "Kurz"}
                </button>
                <button className={`btn ${data.tempo === "voll" ? "btn-solid" : "btn-line"}`} disabled={busy} onClick={() => act({ type: "options", tempo: "voll" })}>
                  {data.type === "risko" ? "Welteroberung" : data.type === "pictionary" ? "Mehrere Runden" : "Voll"}
                </button>
              </div> : null}
              {data.type === "wizard" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(
                    [
                      ["farbe", "Farbblatt"],
                      ["skat", "Skatblatt"],
                    ] as const
                  ).map(([id, label]) => (
                    <button key={id} className={`btn ${data.blatt === id ? "btn-solid" : "btn-line"}`} disabled={busy} onClick={() => act({ type: "options", blatt: id })}>
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
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
              {data.type === "wizard" ? "Farbblatt hat die Zahlen 1 bis 13. Skatblatt hat Kreuz, Pik, Herz und Karo von 7 bis Ass. Dazu Zauberer und Narren." : null}
              {data.type === "uno" ? "Kurz geht bis 100, voll bis 200." : null}
              {data.type === "scotland" ? "London, Paris oder Barcelona, je 199 Stationen. 24 Züge, sichtbar in 3, 8, 13, 18 und 24. Freie Detektive spielst du selbst mit." : null}
              {data.type === "pictionary" ? "Eine Runde heißt, jede Person zeichnet einmal. Mehrere Runden heißt dreimal." : null}
              {data.type === "zehn" ? "Kurz sind vier Aufgaben, voll alle zehn." : null}
              {data.type === "stapel" ? "Der Vorrat hat 10, 20 oder 30 Karten. Zu sechst passen 30 nicht." : null}
              {data.type === "memo" ? "12, 20 oder 30 Kacheln." : null}
              {data.type === "vier" ? "2 bis 4 Personen. Feld 6×5, 7×6 oder 9×7." : null}
              {data.type === "risko" ? "Geheimaufträge sind 14 verdeckte Aufträge. Welteroberung gewinnt, wer alle 42 Gebiete hält." : null}
              {data.players.length < 2 ? ` Allein starten setzt ${BOT_NAME} dazu.` : null}
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
      {data.view ? (
        <ZoomFeld>
      {data.view?.kind === "schiffe" ? <SchiffeBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "wizard" ? <WizardBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "uno" ? <UnoBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "scotland" ? <ScotlandBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "pictionary" ? <SketchBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "zehn" ? <ZehnBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "stapel" ? <StapelBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "memo" ? <MemoBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "vier" ? <VierBoard view={data.view} busy={busy} onAction={act} /> : null}
      {data.view?.kind === "risko" ? <RiskoBoard view={data.view} busy={busy} onAction={act} /> : null}
        </ZoomFeld>
      ) : null}
    </div>
    </NamenWahl>
  );
}
