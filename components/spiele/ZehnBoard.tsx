"use client";

import type { ZehnView } from "@/lib/games/types";
import { useState } from "react";
import { Note } from "../Note";
import { HerzFace } from "./LoveFace";

export function ZehnBoard({ view, busy, onAction }: { view: ZehnView; busy: boolean; onAction: (body: Record<string, unknown>) => Promise<void> }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [buckets, setBuckets] = useState<string[][]>(() => view.task.groups.map(() => []));
  const taskKey = `${view.phase}:${view.youDown}:${view.task.label}:${view.hand.map((card) => card.id).join()}`;
  const [stamp, setStamp] = useState(taskKey);
  if (stamp !== taskKey) {
    setStamp(taskKey);
    setPicked([]);
    setBuckets(view.task.groups.map(() => []));
  }

  function toggle(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function park(index: number) {
    if (picked.length === 0) return;
    setBuckets((current) => current.map((bucket, spot) => (spot === index ? [...bucket, ...picked.filter((id) => !bucket.includes(id))] : bucket.filter((id) => !picked.includes(id)))));
    setPicked([]);
  }

  const ready = view.youAreUp && view.phase === "play" && !busy;

  return (
    <section className="rounded-[1.4rem] bg-[#2a1d22] p-4 text-paper md:p-6">
      <Note banner={view.banner} log={view.log} />
      <p className="mt-3 text-sm opacity-70">
        Deine Aufgabe: {view.task.label}. Ziel ist Aufgabe {view.goal}.
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {view.rows.map((row) => (
          <li key={row.id} className={`rounded-full px-3 py-1 text-sm ${row.id === view.turnId ? "bg-cinnabar" : "bg-white/10"}`}>
            {row.name} · Aufgabe {row.phase} · {row.cards} · {row.score}
            {row.down ? " · liegt" : ""}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-end justify-center gap-4">
        <button className="card-face bg-[#3a2a22]" disabled={!view.youAreUp || view.phase !== "draw" || busy} onClick={() => onAction({ type: "zehn-draw", from: "deck" })} type="button">
          <b>Ziehen</b>
          <small>{view.deck}</small>
        </button>
        {view.discard ? (
          <div className="text-center">
            <HerzFace card={view.discard} />
            <button className="btn btn-line mt-2" disabled={!view.youAreUp || view.phase !== "draw" || busy || view.discard.kind === "schlaf"} onClick={() => onAction({ type: "zehn-draw", from: "ablage" })} type="button">
              Nehmen
            </button>
          </div>
        ) : null}
      </div>
      {view.laid.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {view.laid.map((group, index) => (
            <li key={`${group.owner}-${index}`}>
              <p className="text-sm opacity-70">
                {group.owner} · {group.kind}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {group.cards.map((card) => (
                  <HerzFace key={card.id} card={card} />
                ))}
                {ready && view.youDown && picked.length === 1 ? (
                  <>
                    <button className="btn btn-line" disabled={busy} onClick={() => onAction({ type: "zehn-hit", group: index, id: picked[0] })} type="button">
                      Anlegen
                    </button>
                    {group.kind === "reihe" ? (
                      <>
                        <button className="btn btn-line" disabled={busy} onClick={() => onAction({ type: "zehn-hit", group: index, id: picked[0], edge: "low" })} type="button">
                          Tiefer
                        </button>
                        <button className="btn btn-line" disabled={busy} onClick={() => onAction({ type: "zehn-hit", group: index, id: picked[0], edge: "high" })} type="button">
                          Höher
                        </button>
                      </>
                    ) : null}
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {!view.youDown && view.phase !== "done" ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {view.task.groups.map((group, index) => (
            <div key={`${group.kind}-${index}`} className="min-w-36 rounded-2xl bg-white/5 p-2">
              <p className="text-sm">{group.title}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {buckets[index]?.map((id) => {
                  const card = view.hand.find((item) => item.id === id);
                  return card ? <HerzFace key={id} card={card} on /> : null;
                })}
              </div>
              <button className="btn btn-line mt-2" disabled={!ready || picked.length === 0} onClick={() => park(index)} type="button">
                Hierhin
              </button>
            </div>
          ))}
          <button
            className="btn btn-solid self-end"
            disabled={!ready || buckets.some((bucket, index) => bucket.length !== view.task.groups[index]?.n)}
            onClick={() => onAction({ type: "zehn-lay", groups: buckets })}
            type="button"
          >
            Aufgabe legen
          </button>
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        {view.hand.map((card) => (
          <HerzFace key={card.id} card={card} on={picked.includes(card.id)} disabled={!ready && view.phase !== "draw"} onClick={() => toggle(card.id)} />
        ))}
      </div>
      {ready && picked.length === 1 ? (
        <button className="btn btn-solid mt-4" disabled={busy} onClick={() => onAction({ type: "zehn-discard", id: picked[0] })} type="button">
          Ablegen
        </button>
      ) : null}
    </section>
  );
}
