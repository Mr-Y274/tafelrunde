"use client";

import type { UnoCard, UnoColor, UnoView } from "@/lib/games/types";
import { useState } from "react";
import { Note } from "../Note";
import { useArrivals } from "../motion";

const INK: Record<UnoColor, string> = {
  rot: "bg-[#d6453d] text-white",
  gelb: "bg-[#e2b43a] text-ink",
  gruen: "bg-[#2f8f5b] text-white",
  blau: "bg-[#2d62c0] text-white",
};

function label(card: UnoCard) {
  if (card.value === "reverse") return "↺";
  if (card.value === "draw2") return "+2";
  if (card.value === "wild") return "Rainbow";
  if (card.value === "wild4") return "+4";
  return card.value;
}

function Face({ card, glow, arrive }: { card: UnoCard; glow?: UnoColor; arrive?: boolean }) {
  const rainbow = card.value === "wild";
  const skip = card.value === "skip";
  const number = card.value.length === 1 && card.value >= "0" && card.value <= "9";
  const stretched = card.value === "draw2" || card.value === "wild4" || card.value === "reverse";
  const black = card.value === "wild4";
  const tone = black
    ? "bg-black text-white"
    : rainbow
      ? "bg-[linear-gradient(145deg,#e23b2f_0%,#f0a202_24%,#f4e36a_42%,#3dce78_60%,#2d9cdb_78%,#7a5cff_100%)] text-white"
      : card.color
        ? INK[card.color]
        : "bg-ink text-paper";
  return (
    <span
      className={`card-face overflow-hidden ${tone} ${glow ? "ring-4 ring-white/70" : ""} ${number || stretched || skip ? "items-center justify-center !p-0 [container-type:size]" : ""} ${arrive ? "rise" : ""}`}
      style={black ? { backgroundColor: "#000", color: "#fff" } : undefined}
    >
      {skip ? (
        <svg viewBox="0 0 100 140" className="block h-full w-full" role="img" aria-label="Aussetzen">
          <circle cx="50" cy="70" r="36" fill="none" stroke="currentColor" strokeWidth="12" />
          <path d="M24 100 L76 40" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
        </svg>
      ) : stretched ? (
        <svg viewBox="0 0 100 140" preserveAspectRatio="none" className="block h-full w-full" aria-hidden="true">
          <text x="50" y="74" textAnchor="middle" dominantBaseline="central" textLength="92" lengthAdjust="spacingAndGlyphs" fontSize="112" fontWeight="700" fill="currentColor" fontFamily="var(--font-outfit), sans-serif">
            {label(card)}
          </text>
        </svg>
      ) : (
        <>
          <b className={number ? "leading-none text-[88cqh]" : "text-center text-xl leading-none"} style={rainbow ? { textShadow: "0 1px 2px rgba(22,19,15,0.55)" } : undefined}>
            {label(card)}
          </b>
          {number ? null : <small>{rainbow ? (glow ? glow : "Farbe") : (card.color ?? glow ?? "Wahl")}</small>}
        </>
      )}
    </span>
  );
}

export function UnoBoard({ view, busy, onAction }: { view: UnoView; busy: boolean; onAction: (body: Record<string, unknown>) => Promise<void> }) {
  const [wild, setWild] = useState<UnoColor>("rot");
  const [picked, setPicked] = useState<string | null>(null);
  const fresh = useArrivals([`top:${view.top.id}`, ...view.hand.map((item) => `hand:${item.id}`)], true);
  const card = view.hand.find((item) => item.id === picked);
  const needsColor = card?.value === "wild" || card?.value === "wild4";

  function play(uno: boolean) {
    if (!card) return;
    void onAction({ type: "uno-play", id: card.id, color: needsColor ? wild : undefined, uno });
    setPicked(null);
  }

  return (
    <section className="rounded-[1.4rem] bg-[#1a1614] p-4 text-paper md:p-6">
      <Note banner={view.banner} log={view.log} />
      <p className="mt-3 text-sm opacity-70">
        Ziel {view.target} · {view.dir === 1 ? "im Uhrzeigersinn" : "gegen den Uhrzeigersinn"} · Stapel {view.drawCount}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {view.rows.map((row) => (
          <li key={row.id} className={`rounded-full px-3 py-1 text-sm ${row.id === view.turnId ? "bg-cinnabar" : "bg-white/10"}`}>
            {row.name} · {row.cards} · {row.score}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-center gap-6">
        <button className="card-face bg-[#3a2a22]" disabled={busy || !view.youAreUp || (view.phase !== "play" && view.phase !== "penalty")} onClick={() => onAction({ type: "uno-draw" })} aria-label="Ziehen">
          <b>Ziehen</b>
        </button>
        <Face card={view.top} glow={view.color} arrive={fresh.has(`top:${view.top.id}`)} />
      </div>
      {view.canCatch ? (
        <button className="btn btn-solid mt-4" disabled={busy} onClick={() => onAction({ type: "uno-catch" })}>
          Uno vergessen
        </button>
      ) : null}
      {view.youAreUp && view.phase === "opening-color" ? (
        <div className="mt-4 flex gap-2">
          {(Object.keys(INK) as UnoColor[]).map((color) => (
            <button key={color} className="btn btn-line" disabled={busy} onClick={() => onAction({ type: "uno-color", color })}>
              {color}
            </button>
          ))}
        </div>
      ) : null}
      {view.youAreUp && view.phase === "penalty" ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button className="btn btn-solid" disabled={busy} onClick={() => onAction({ type: "uno-draw" })}>
            {view.pendingDraw} ziehen
          </button>
          <p className="text-sm opacity-70">Oder lege eine +2, egal welche Farbe.</p>
        </div>
      ) : null}
      {view.youAreUp && view.phase === "challenge" ? (
        <div className="mt-4 flex gap-2">
          <button className="btn btn-solid" disabled={busy} onClick={() => onAction({ type: "uno-challenge", challenge: false })}>
            +4 ziehen
          </button>
          <button className="btn btn-line" disabled={busy} onClick={() => onAction({ type: "uno-challenge", challenge: true })}>
            Anzweifeln
          </button>
        </div>
      ) : null}
      {view.youAreUp && view.phase === "drawn" ? (
        <button className="btn btn-line mt-4" disabled={busy} onClick={() => onAction({ type: "uno-pass" })}>
          Passen
        </button>
      ) : null}
      <div className="mt-6 flex max-w-full gap-2 overflow-x-auto pb-2">
        {view.hand.map((item) => {
          const legal = view.legalIds.includes(item.id);
          return (
            <button key={item.id} disabled={!legal || busy} className={legal ? "" : "opacity-40"} onClick={() => setPicked(item.id)}>
              <Face card={item} arrive={fresh.has(`hand:${item.id}`)} />
            </button>
          );
        })}
      </div>
      {card ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {needsColor
            ? (Object.keys(INK) as UnoColor[]).map((color) => (
                <button key={color} className={`btn ${wild === color ? "btn-solid" : "btn-line"}`} onClick={() => setWild(color)}>
                  {color}
                </button>
              ))
            : null}
          <button className="btn btn-solid" disabled={busy} onClick={() => play(view.hand.length === 2)}>
            {view.hand.length === 2 ? "Legen und Uno" : "Legen"}
          </button>
          {view.hand.length === 2 ? (
            <button className="btn btn-line" disabled={busy} onClick={() => play(false)}>
              Leise legen
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
