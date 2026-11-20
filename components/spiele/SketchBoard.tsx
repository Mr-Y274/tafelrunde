"use client";

import { PEN_SIZES, PENCILS } from "@/lib/games/sketch";
import type { PictionaryView, SketchStroke } from "@/lib/games/types";
import { useEffect, useRef, useState } from "react";
import { Note } from "../Note";

function points(list: [number, number][]) {
  return list.map(([x, y]) => `${x},${y}`).join(" ");
}

function sameStroke(a: SketchStroke, b: SketchStroke) {
  if (a.color !== b.color || a.size !== b.size || a.points.length !== b.points.length) return false;
  return a.points.every((point, index) => point[0] === b.points[index]?.[0] && point[1] === b.points[index]?.[1]);
}

function stillHeld(held: SketchStroke[], strokes: SketchStroke[]) {
  const used = new Set<number>();
  return held.filter((item) => {
    const index = strokes.findIndex((stroke, strokeIndex) => !used.has(strokeIndex) && sameStroke(item, stroke));
    if (index < 0) return true;
    used.add(index);
    return false;
  });
}

export function SketchBoard({ view, busy, onAction }: { view: PictionaryView; busy: boolean; onAction: (body: Record<string, unknown>) => Promise<void> }) {
  const drawing = useRef(false);
  const liveRef = useRef<[number, number][]>([]);
  const [live, setLive] = useState<[number, number][]>([]);
  const [held, setHeld] = useState<SketchStroke[]>([]);
  const [color, setColor] = useState<(typeof PENCILS)[number]>(PENCILS[0]);
  const [size, setSize] = useState<(typeof PEN_SIZES)[number]>(16);
  const [guess, setGuess] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const sheet = `${view.round}:${view.phase}:${view.board}`;
  const [sheetKey, setSheetKey] = useState(sheet);

  if (sheetKey !== sheet) {
    setSheetKey(sheet);
    setHeld([]);
    setLive([]);
    liveRef.current = [];
    drawing.current = false;
  } else {
    const next = stillHeld(held, view.strokes);
    if (next.length !== held.length) setHeld(next);
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, []);

  const left = Math.max(0, view.turnEndsAt - now);
  const ratio = view.phase === "draw" ? Math.min(1, left / 70_000) : 0;

  function at(event: React.PointerEvent<SVGSVGElement>) {
    const svg = event.currentTarget;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return [0, 0] as [number, number];
    const local = point.matrixTransform(matrix.inverse());
    const box = svg.viewBox.baseVal;
    const x = Math.round(Math.max(box.x, Math.min(box.x + box.width, local.x)));
    const y = Math.round(Math.max(box.y, Math.min(box.y + box.height, local.y)));
    return [x, y] as [number, number];
  }

  function finish() {
    if (!drawing.current) return;
    drawing.current = false;
    const drawn = liveRef.current;
    liveRef.current = [];
    setLive([]);
    if (drawn.length === 0) return;
    const stroke: SketchStroke = { color, size, points: drawn };
    setHeld((list) => [...list, stroke]);
    void onAction({ type: "stroke", color, size, points: drawn }).catch(() => {
      setHeld((list) => list.filter((item) => item !== stroke));
    });
  }

  return (
    <section className="panel p-4 md:p-6">
      <div className="flex flex-wrap items-stretch justify-between gap-3">
        <div>
          <p className="kicker">
            Bild {view.round} von {view.rounds}
          </p>
          <p className="mt-1 text-sm">{view.youDraw ? "Du zeichnest" : `${view.drawerName} zeichnet`}</p>
        </div>
        <div className="min-w-40 rounded-2xl bg-ink/5 px-4 py-2">
          <p className="kicker">Themenbereich</p>
          <p className="font-display text-2xl">{view.category}</p>
        </div>
        {view.youDraw ? (
          <div className="rounded-2xl bg-cinnabar/10 px-4 py-2">
            <p className="kicker">Dein Wort</p>
            <p className="font-display text-3xl">{view.word}</p>
            <button className="btn btn-line mt-2" disabled={busy || view.skipsLeft <= 0} onClick={() => onAction({ type: "skip" })}>
              {view.skipsLeft > 0 ? `Überspringen · noch ${view.skipsLeft}` : "Kein Überspringen mehr"}
            </button>
          </div>
        ) : null}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full bg-cinnabar" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="mt-3">
        <Note banner={view.banner} log={view.log} />
      </div>
      <svg
        viewBox="0 0 1000 700"
        className="mt-4 aspect-[10/7] w-full touch-none rounded-2xl bg-[#f7f1e6]"
        onPointerDown={(event) => {
          if (!view.youDraw) return;
          drawing.current = true;
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            /* Der Zeiger ist schon weg. Der Strich bleibt trotzdem liegen. */
          }
          liveRef.current = [at(event)];
          setLive(liveRef.current);
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          liveRef.current = [...liveRef.current, at(event)].slice(-200);
          setLive(liveRef.current);
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        {view.strokes.map((stroke, index) => (
          <polyline key={`saved-${index}`} className="fade" points={points(stroke.points)} fill="none" stroke={stroke.color} strokeWidth={stroke.size} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {held.map((stroke, index) => (
          <polyline key={`held-${index}`} points={points(stroke.points)} fill="none" stroke={stroke.color} strokeWidth={stroke.size} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {live.length > 0 ? <polyline points={points(live)} fill="none" stroke={color} strokeWidth={size} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
      {view.youDraw ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {PENCILS.map((ink) => (
            <button key={ink} aria-label={ink} className="h-11 w-11 rounded-full" style={{ background: ink, outline: color === ink ? "2px solid #16130f" : undefined, outlineOffset: 2 }} onClick={() => setColor(ink)} />
          ))}
          {PEN_SIZES.map((pen) => (
            <button key={pen} className={`btn ${size === pen ? "btn-solid" : "btn-line"}`} onClick={() => setSize(pen)}>
              {pen === 8 ? "Fein" : pen === 16 ? "Mittel" : "Breit"}
            </button>
          ))}
          <button className="btn btn-line" disabled={busy} onClick={() => onAction({ type: "undo" })}>
            Zurück
          </button>
          <button className="btn btn-line" disabled={busy} onClick={() => onAction({ type: "clear" })}>
            Neu
          </button>
        </div>
      ) : null}
      {view.youCanGuess ? (
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            const text = guess.trim();
            if (!text) return;
            void onAction({ type: "guess", text });
            setGuess("");
          }}
        >
          <input className="field" value={guess} onChange={(event) => setGuess(event.target.value)} placeholder="Was ist das?" aria-label="Tipp" enterKeyHint="send" maxLength={40} />
          <button className="btn btn-solid w-full sm:w-auto" disabled={busy}>
            Raten
          </button>
        </form>
      ) : null}
      <ul className="mt-3 text-sm opacity-70">
        {view.guesses.map((item, index) => (
          <li key={`${item.name}-${index}`}>
            {item.name}: {item.text}
          </li>
        ))}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-3 text-sm">
        {view.scores.map((score) => (
          <li key={score.id}>
            {score.name} {score.score}
          </li>
        ))}
      </ul>
    </section>
  );
}
