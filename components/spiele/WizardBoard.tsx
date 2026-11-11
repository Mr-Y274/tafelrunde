"use client";

import type { Suit, WCard, WizardView } from "@/lib/games/types";
import { Note } from "../Note";

const SUITS: { id: Suit; label: string; ink: string }[] = [
  { id: "rot", label: "Rot", ink: "text-[#d6453d]" },
  { id: "gelb", label: "Gelb", ink: "text-[#b8860b]" },
  { id: "gruen", label: "Grün", ink: "text-[#2c6b4a]" },
  { id: "blau", label: "Blau", ink: "text-[#2d62c0]" },
];

function Face({ card }: { card: WCard }) {
  if (card.t === "W") return <span className="card-face bg-ink text-gold"><b className="text-2xl">✦</b><small>Zauberer</small></span>;
  if (card.t === "J") return <span className="card-face bg-[repeating-linear-gradient(45deg,#f3eadc,#f3eadc_6px,#16130f_6px,#16130f_8px)] text-ink"><b className="text-2xl">N</b><small>Narr</small></span>;
  const suit = SUITS.find((item) => item.id === card.suit);
  return (
    <span className={`card-face bg-paper ${suit?.ink ?? ""}`}>
      <b className="text-2xl">{card.rank}</b>
      <small>{suit?.label}</small>
    </span>
  );
}

export function WizardBoard({ view, busy, onAction }: { view: WizardView; busy: boolean; onAction: (body: Record<string, unknown>) => Promise<void> }) {
  return (
    <section className="rounded-[1.4rem] bg-[#1d4634] p-4 text-paper md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="kicker">
          Runde {view.round} von {view.maxRounds}
        </p>
        <p>
          {view.trumpSuit ? `Trumpf ${SUITS.find((suit) => suit.id === view.trumpSuit)?.label}` : "Kein Trumpf"}
          {view.trumpCard ? "" : ""}
        </p>
      </div>
      <div className="mt-3">
        <Note banner={view.banner} log={view.log} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {view.trumpCard ? <Face card={view.trumpCard} /> : <p className="opacity-70">Keine Trumpfkarte</p>}
        <div className="flex min-h-24 flex-wrap gap-2">
          {view.trick.map((item) => (
            <div key={item.card.id}>
              <Face card={item.card} />
              <p className="mt-1 text-center text-xs">{item.name}</p>
            </div>
          ))}
        </div>
      </div>
      {view.youAreUp && view.phase === "trump" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUITS.map((suit) => (
            <button key={suit.id} className="btn btn-solid" disabled={busy} onClick={() => onAction({ type: "trump", suit: suit.id })}>
              {suit.label}
            </button>
          ))}
        </div>
      ) : null}
      {view.youAreUp && view.phase === "bid" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: view.cardsThisRound + 1 }, (_, n) => (
            <button key={n} className="btn btn-line" disabled={busy} onClick={() => onAction({ type: "bid", n })}>
              {n}
            </button>
          ))}
        </div>
      ) : null}
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {view.rows.map((row) => (
          <li key={row.id} className="flex justify-between rounded-full bg-black/15 px-3 py-2 text-sm">
            <span>
              {row.name}
              {row.id === view.turnId ? " · dran" : ""}
            </span>
            <span>
              {row.bid ?? "–"}/{row.won} · {row.score}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {view.hand.map((card) => {
          const legal = view.legalIds.includes(card.id);
          return (
            <button key={card.id} disabled={busy || !legal} className={legal ? "" : "opacity-40"} onClick={() => onAction({ type: "card", id: card.id })}>
              <Face card={card} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
