"use client";

import { stapelFits } from "@/lib/games/stapel";
import type { StapelCard, StapelView } from "@/lib/games/types";
import { useState } from "react";
import { Note } from "../Note";
import { useArrivals } from "../motion";
import { StapelFace } from "./LoveFace";

type Pick = { from: "hand" | "stock" | "ablage"; id?: string; slot?: number };

function Top({ card, label }: { card: StapelCard | null; label: string }) {
  return card ? <StapelFace card={card} /> : <span className="card-face bg-white/10"><b>{label}</b></span>;
}

function mark(card: { n: number | null; wild?: boolean }) {
  if (card.n == null) return "SB";
  return card.wild ? `SB ${card.n}` : String(card.n);
}

function PileList({ bin }: { bin: { count: number; cards: { n: number | null; wild?: boolean }[] } }) {
  return (
    <span className="mt-1 block max-w-28 text-center text-xs leading-snug">
      {bin.count === 0 ? "leer" : bin.count === 1 ? "1 Karte" : `${bin.count} Karten`}
      {bin.cards.length > 0 ? <span className="mt-1 block">{bin.cards.map(mark).join(" · ")}</span> : null}
    </span>
  );
}

export function StapelBoard({ view, busy, onAction }: { view: StapelView; busy: boolean; onAction: (body: Record<string, unknown>) => Promise<void> }) {
  const [pick, setPick] = useState<Pick | null>(null);
  const live = view.youAreUp && view.phase === "play" && !busy;
  const fresh = useArrivals(
    [
      view.stockTop ? `stock:${view.stockTop.id}` : "",
      ...view.hand.map((card) => `hand:${card.id}`),
      ...view.bins.map((bin, index) => `bin:${index}:${bin.count}:${bin.n ?? ""}`),
      ...view.piles.map((pile, index) => `pile:${index}:${pile.n ?? ""}:${pile.wild ? 1 : 0}`),
    ],
    true,
  );
  const chosen = pick?.from === "hand" ? view.hand.find((card) => card.id === pick.id) : pick?.from === "stock" ? view.stockTop : pick?.from === "ablage" ? faceOf(view.bins[pick.slot ?? -1]) : null;

  function play(pile: number) {
    if (!pick || !chosen) return;
    const top = view.piles[pile]?.n ?? 0;
    if (!stapelFits(chosen, top)) return;
    void onAction({ type: "stapel-play", from: pick.from, id: pick.id, pile, slot: pick.slot });
    setPick(null);
  }

  return (
    <section className="rounded-[1.4rem] bg-[#16324a] p-4 text-paper md:p-6">
      <Note banner={view.banner} log={view.log} />
      <ul className="mt-3 space-y-3 text-sm">
        {view.others.map((player) => (
          <li key={player.id}>
            <p className={`inline-block rounded-full px-3 py-1 ${player.id === view.turnId ? "bg-cinnabar" : "bg-white/10"}`}>
              {player.name} · Vorrat {player.stock}
              {player.top ? ` · ${mark(player.top)}` : ""}
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {player.bins.map((bin, index) => (
                <div key={index}>
                  <span className="block text-xs opacity-70">Ablage {index + 1}</span>
                  <PileList bin={bin} />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {view.piles.map((pile, index) => (
          <button key={index} className="rounded-2xl bg-white/5 p-3" disabled={!live || !chosen || !stapelFits(chosen, pile.n ?? 0)} onClick={() => play(index)} type="button">
            <span className="block text-sm opacity-70">Bau {index + 1}</span>
            <span className={`mt-2 block text-4xl ${fresh.has(`pile:${index}:${pile.n ?? ""}:${pile.wild ? 1 : 0}`) ? "pop" : ""}`}>{pile.n == null ? "1" : pile.n}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <button className={pick?.from === "stock" ? "rounded-2xl ring-4 ring-cinnabar" : ""} disabled={!live || !view.stockTop} onClick={() => setPick({ from: "stock" })} type="button">
          <span className={view.stockTop && fresh.has(`stock:${view.stockTop.id}`) ? "rise" : ""}>
            <Top card={view.stockTop} label="leer" />
          </span>
          <span className="mt-1 block text-center text-sm">Vorrat {view.stockCount}</span>
        </button>
        {view.bins.map((bin, index) => (
          <div key={index} className="text-center">
            <button className={pick?.from === "ablage" && pick.slot === index ? "rounded-2xl ring-4 ring-cinnabar" : ""} disabled={!live || bin.count === 0} onClick={() => setPick({ from: "ablage", slot: index })} type="button">
              <span className={fresh.has(`bin:${index}:${bin.count}:${bin.n ?? ""}`) ? "rise" : ""}>
                <Top card={faceOf(bin)} label="Ablage" />
              </span>
            </button>
            <PileList bin={bin} />
            {pick?.from === "hand" ? (
              <button className="btn btn-line mt-2" disabled={!live} onClick={() => onAction({ type: "stapel-end", id: pick.id, slot: index })} type="button">
                Ab
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {view.hand.map((card) => (
          <StapelFace key={card.id} card={card} on={pick?.from === "hand" && pick.id === card.id} disabled={!live} onClick={() => setPick({ from: "hand", id: card.id })} arrive={fresh.has(`hand:${card.id}`)} />
        ))}
      </div>
      {live && view.hand.length === 0 ? (
        <button className="btn btn-line mt-4" disabled={busy} onClick={() => onAction({ type: "stapel-end", slot: 0 })} type="button">
          Weitergeben
        </button>
      ) : null}
    </section>
  );
}

function faceOf(bin: { n: number | null; wild?: boolean; count: number } | undefined): StapelCard | null {
  if (!bin || bin.count === 0) return null;
  return { id: "top", n: bin.n, wild: bin.wild };
}
