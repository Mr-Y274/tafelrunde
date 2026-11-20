"use client";

import type { Blatt, Suit, WCard, WizardView } from "@/lib/games/types";
import { Note } from "../Note";
import { useArrivals } from "../motion";

const SUITS: { id: Suit; label: string; mark: string; paper: string; blatt: Blatt }[] = [
  { id: "rot", label: "Rot", mark: "", paper: "#e04b43", blatt: "farbe" },
  { id: "gelb", label: "Gelb", mark: "", paper: "#e2b43a", blatt: "farbe" },
  { id: "gruen", label: "Grün", mark: "", paper: "#3aaa6a", blatt: "farbe" },
  { id: "blau", label: "Blau", mark: "", paper: "#3b6fd0", blatt: "farbe" },
  { id: "kreuz", label: "Kreuz", mark: "♣", paper: "#d7dbe3", blatt: "skat" },
  { id: "pik", label: "Pik", mark: "♠", paper: "#c9ced6", blatt: "skat" },
  { id: "herz", label: "Herz", mark: "♥", paper: "#e04b43", blatt: "skat" },
  { id: "karo", label: "Karo", mark: "♦", paper: "#e04b43", blatt: "skat" },
];

function faceRank(rank: number, blatt: Blatt) {
  if (blatt !== "skat") return String(rank);
  if (rank === 11) return "B";
  if (rank === 12) return "D";
  if (rank === 13) return "K";
  if (rank === 14) return "A";
  return String(rank);
}

function Face({ card, arrive, blatt }: { card: WCard; arrive?: boolean; blatt: Blatt }) {
  const motion = arrive ? "rise" : "";
  if (card.t === "W") return <span className={`card-face bg-ink text-gold ${motion}`}><b className="text-2xl">✦</b><small>Zauberer</small></span>;
  if (card.t === "J") return <span className={`card-face bg-[repeating-linear-gradient(45deg,#f3eadc,#f3eadc_6px,#16130f_6px,#16130f_8px)] text-ink ${motion}`}><b className="text-2xl">N</b><small>Narr</small></span>;
  const suit = SUITS.find((item) => item.id === card.suit);
  const rank = faceRank(card.rank, blatt);
  const mark = blatt === "skat" ? (suit?.mark ?? "") : "";
  const two = rank.length > 1;
  const size = mark ? (two ? 64 : 100) : two ? 68 : 118;
  return (
    <span className={`card-face overflow-hidden !p-0 ${motion}`} style={{ backgroundColor: suit?.paper ?? "#f3eadc" }}>
      <svg viewBox="0 0 100 140" className="block h-full w-full" role="img" aria-label={suit ? `${rank} ${suit.label}` : rank}>
        <text x="50" y={mark ? 62 : 72} textAnchor="middle" dominantBaseline="central" fontSize={size} fontWeight="700" fill="#16130f" fontFamily="var(--font-outfit), sans-serif">
          {rank}
        </text>
        {mark ? (
          <text x="50" y="122" textAnchor="middle" dominantBaseline="central" fontSize="28" fill="#16130f" fontFamily="var(--font-outfit), sans-serif">
            {mark}
          </text>
        ) : null}
      </svg>
    </span>
  );
}

export function WizardBoard({ view, busy, onAction }: { view: WizardView; busy: boolean; onAction: (body: Record<string, unknown>) => Promise<void> }) {
  const fresh = useArrivals([view.trumpCard ? `trump:${view.trumpCard.id}` : "", ...view.trick.map((item) => `trick:${item.card.id}`), ...view.hand.map((card) => `hand:${card.id}`)], true);
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
        {view.trumpCard ? <Face card={view.trumpCard} blatt={view.blatt} arrive={fresh.has(`trump:${view.trumpCard.id}`)} /> : <p className="opacity-70">Keine Trumpfkarte</p>}
        <div className="flex min-h-24 flex-wrap gap-2">
          {view.trick.map((item) => (
            <div key={item.card.id}>
              <Face card={item.card} blatt={view.blatt} arrive={fresh.has(`trick:${item.card.id}`)} />
              <p className="mt-1 text-center text-xs">{item.name}</p>
            </div>
          ))}
        </div>
      </div>
      {view.youAreUp && view.phase === "trump" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUITS.filter((suit) => suit.blatt === view.blatt).map((suit) => (
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
      <div className="mt-5 flex max-w-full gap-2 overflow-x-auto pb-2">
        {view.hand.map((card) => {
          const legal = view.legalIds.includes(card.id);
          return (
            <button key={card.id} disabled={busy || !legal} className={legal ? "" : "opacity-40"} onClick={() => onAction({ type: "card", id: card.id })}>
              <Face card={card} blatt={view.blatt} arrive={fresh.has(`hand:${card.id}`)} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
