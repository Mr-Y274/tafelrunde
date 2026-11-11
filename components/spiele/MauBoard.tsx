"use client";

import { ANIMALS, type LoveAnimal } from "@/lib/games/love";
import type { MauView } from "@/lib/games/types";
import { useState } from "react";
import { Note } from "../Note";
import { MauFace, animalName } from "./LoveFace";

export function MauBoard({ view, busy, onAction }: { view: MauView; busy: boolean; onAction: (body: Record<string, unknown>) => Promise<void> }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [animal, setAnimal] = useState<LoveAnimal>("hase");
  const card = view.hand.find((item) => item.id === picked);
  const live = view.youAreUp && !busy;
  const needsAnimal = card?.rank === "B" && view.pending === 0;

  return (
    <section className="rounded-[1.4rem] bg-[#2a1d22] p-4 text-paper md:p-6">
      <Note banner={view.banner} log={view.log} />
      <p className="mt-3 text-sm opacity-70">
        Gesucht wird {animalName(view.animal)} · {view.dir === 1 ? "im Uhrzeigersinn" : "gegen den Uhrzeigersinn"} · Stapel {view.deck}
        {view.pending > 0 ? ` · ${view.pending} ziehen` : ""}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {view.rows.map((row) => (
          <li key={row.id} className={`rounded-full px-3 py-1 text-sm ${row.id === view.turnId ? "bg-cinnabar" : "bg-white/10"}`}>
            {row.name} · {row.cards}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-center">
        <MauFace card={view.top} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {view.hand.map((item) => (
          <MauFace key={item.id} card={item} on={picked === item.id} disabled={!live || !view.legalIds.includes(item.id)} onClick={() => setPicked(item.id)} />
        ))}
      </div>
      {needsAnimal ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {ANIMALS.map((item) => (
            <button key={item.id} className={`btn ${animal === item.id ? "btn-solid" : "btn-line"}`} disabled={!live} onClick={() => setAnimal(item.id)} type="button">
              {item.mark} {item.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {card && view.legalIds.includes(card.id) ? (
          <button className="btn btn-solid" disabled={!live || (needsAnimal && !animal)} onClick={() => onAction({ type: "mau-play", id: card.id, animal: needsAnimal ? animal : undefined })} type="button">
            Legen
          </button>
        ) : null}
        {view.phase === "play" ? (
          <button className="btn btn-line" disabled={!live} onClick={() => onAction({ type: "mau-draw" })} type="button">
            {view.pending > 0 ? `${view.pending} ziehen` : "Ziehen"}
          </button>
        ) : null}
        {view.phase === "drawn" ? (
          <button className="btn btn-line" disabled={!live} onClick={() => onAction({ type: "mau-keep" })} type="button">
            Behalten
          </button>
        ) : null}
      </div>
    </section>
  );
}
