"use client";

import type { UnoCard, UnoColor, UnoView } from "@/lib/games/types";
import { useState } from "react";
import { Note } from "../Note";

const INK: Record<UnoColor, string> = {
  rot: "bg-[#d6453d] text-white",
  gelb: "bg-[#e2b43a] text-ink",
  gruen: "bg-[#2f8f5b] text-white",
  blau: "bg-[#2d62c0] text-white",
};

function label(card: UnoCard) {
  if (card.value === "skip") return "Aus";
  if (card.value === "reverse") return "↺";
  if (card.value === "draw2") return "+2";
  if (card.value === "wild") return "Joker";
  if (card.value === "wild4") return "+4";
  return card.value;
}

function Face({ card, glow }: { card: UnoCard; glow?: UnoColor }) {
  const tone = card.color ? INK[card.color] : "bg-ink text-paper";
  return (
    <span className={`card-face ${tone} ${glow ? "ring-4 ring-white/70" : ""}`}>
      <b className="text-2xl">{label(card)}</b>
      <small>{card.color ?? glow ?? "Wahl"}</small>
    </span>
  );
}

export function UnoBoard({ view, busy, onAction }: { view: UnoView; busy: boolean; onAction: (body: Record<string, unknown>) => Promise<void> }) {
  const [wild, setWild] = useState<UnoColor>("rot");
  const [picked, setPicked] = useState<string | null>(null);
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
        <Face card={view.top} glow={view.color} />
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
        <button className="btn btn-solid mt-4" disabled={busy} onClick={() => onAction({ type: "uno-draw" })}>
          {view.pendingDraw} ziehen
        </button>
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
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {view.hand.map((item) => {
          const legal = view.legalIds.includes(item.id);
          return (
            <button key={item.id} disabled={!legal || busy} className={legal ? "" : "opacity-40"} onClick={() => setPicked(item.id)}>
              <Face card={item} />
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
