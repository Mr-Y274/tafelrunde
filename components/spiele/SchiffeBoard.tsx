"use client";

import { FLEET, fleetMeta } from "@/lib/games/fleet";
import type { SchiffeView, ShipId } from "@/lib/games/types";
import { useEffect, useState } from "react";
import { Note } from "../Note";
import { useArrivals } from "../motion";

const letters = "ABCDEFGHIJ".split("");

function cellsOf(id: ShipId, x: number, y: number, dir: "h" | "v") {
  const cells: [number, number][] = [];
  for (let step = 0; step < fleetMeta(id).len; step++) {
    cells.push([x + (dir === "h" ? step : 0), y + (dir === "v" ? step : 0)]);
  }
  return cells;
}

const GREEN = "#3dce78";
const RED = "#e23b2f";
const PURPLE = "#b06bff";

function tone(mark: { hit: boolean } | undefined, ship: { sunk: boolean } | undefined) {
  if (ship?.sunk) return "bg-moss";
  if (mark?.hit) return "bg-cinnabar";
  if (mark) return "bg-[#9a938a]";
  if (ship) return "bg-[#e7d7b8]";
  return "bg-[#1b4d5c]";
}

function shipHit(ship: { cells: [number, number][] }, marks: { x: number; y: number; hit: boolean }[]) {
  return ship.cells.some(([x, y]) => marks.some((shot) => shot.hit && shot.x === x && shot.y === y));
}

function rim(ship: { cells: [number, number][]; sunk: boolean } | undefined, x: number, y: number, color: string | null) {
  if (!ship || !color) return undefined;
  const has = (cx: number, cy: number) => ship.cells.some(([sx, sy]) => sx === cx && sy === cy);
  const edge = (open: boolean) => (open ? `3px solid ${color}` : "1px solid rgba(255,255,255,0.15)");
  return {
    borderTop: edge(!has(x, y - 1)),
    borderRight: edge(!has(x + 1, y)),
    borderBottom: edge(!has(x, y + 1)),
    borderLeft: edge(!has(x - 1, y)),
  };
}

function Grid({
  title,
  marks,
  ships,
  side,
  onCell,
}: {
  title: string;
  marks: { x: number; y: number; hit: boolean }[];
  ships: { id: ShipId; cells: [number, number][]; sunk: boolean }[];
  side: "own" | "foe";
  onCell?: (x: number, y: number) => void;
}) {
  const landed = useArrivals(marks.map((shot) => `${shot.x},${shot.y}`));
  function colorOf(ship: { cells: [number, number][]; sunk: boolean }) {
    if (side === "foe") return ship.sunk ? PURPLE : null;
    return shipHit(ship, marks) ? RED : GREEN;
  }

  return (
    <div>
      <h2 className="mb-2 font-display text-2xl">{title}</h2>
      <div className="relative grid grid-cols-[0.8rem_repeat(10,minmax(0,1fr))] gap-[3px] text-center text-[0.65rem] sm:grid-cols-[1.2rem_repeat(10,minmax(0,1fr))] sm:gap-1 sm:text-xs">
        <span />
        {letters.map((letter) => (
          <span key={letter}>{letter}</span>
        ))}
        {Array.from({ length: 10 }, (_, y) => (
          <div key={y} className="contents">
            <span className="self-center">{y + 1}</span>
            {Array.from({ length: 10 }, (_, x) => {
              const mark = marks.find((shot) => shot.x === x && shot.y === y);
              const ship = ships.find((item) => item.cells.some(([cx, cy]) => cx === x && cy === y));
              const label = `${letters[x]}${y + 1}`;
              const name = ship ? fleetMeta(ship.id).name : "";
              const state = ship?.sunk ? "versenkt" : mark?.hit ? "Treffer" : mark ? "Wasser" : ship ? "Schiff" : "frei";
              return (
                <button
                  key={label}
                  type="button"
                  aria-label={name ? `${label}, ${name}, ${state}` : `${label}, ${state}`}
                  disabled={!onCell}
                  onClick={() => onCell?.(x, y)}
                  className={`aspect-square rounded-sm border border-white/15 ${tone(mark, ship)} ${mark && landed.has(`${x},${y}`) ? "pop" : ""}`}
                  style={rim(ship, x, y, ship ? colorOf(ship) : null)}
                />
              );
            })}
          </div>
        ))}
        {ships.map((ship) => {
          const showName = side === "own" || ship.sunk;
          if (!showName) return null;
          const xs = ship.cells.map(([x]) => x);
          const ys = ship.cells.map(([, y]) => y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const vertical = maxX === minX;
          const name = fleetMeta(ship.id).name;
          return (
            <span
              key={ship.id}
              className="pointer-events-none absolute z-10 overflow-hidden [container-type:size]"
              style={{
                gridColumn: `${minX + 2} / ${maxX + 3}`,
                gridRow: `${minY + 2} / ${maxY + 3}`,
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              }}
            >
              <svg
                viewBox="0 0 100 24"
                preserveAspectRatio="none"
                aria-hidden="true"
                style={
                  vertical
                    ? { position: "absolute", left: "50%", top: "50%", width: "100cqh", height: "100cqw", transform: "translate(-50%, -50%) rotate(90deg)" }
                    : { display: "block", width: "100%", height: "100%" }
                }
              >
                <text
                  x="50"
                  y="13"
                  textAnchor="middle"
                  dominantBaseline="central"
                  textLength="98"
                  lengthAdjust="spacingAndGlyphs"
                  fontSize="22"
                  fontWeight="700"
                  fill="#fff"
                  fontFamily="var(--font-outfit), sans-serif"
                  style={{ filter: "drop-shadow(0 1px 1px #102028)" }}
                >
                  {name}
                </text>
              </svg>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function SchiffeBoard({ view, busy, onAction }: { view: SchiffeView; busy: boolean; onAction: (body: Record<string, unknown>) => Promise<void> }) {
  const [dir, setDir] = useState<"h" | "v">("h");
  const [picked, setPicked] = useState<ShipId>("schlacht");
  const [placed, setPlaced] = useState<Partial<Record<ShipId, { x: number; y: number; dir: "h" | "v" }>>>({});

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "r") setDir((current) => (current === "h" ? "v" : "h"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function occupy(except?: ShipId) {
    const taken = new Set<string>();
    for (const ship of FLEET) {
      const spot = placed[ship.id];
      if (!spot || ship.id === except) continue;
      for (const [x, y] of cellsOf(ship.id, spot.x, spot.y, spot.dir)) taken.add(`${x},${y}`);
    }
    return taken;
  }

  function place(x: number, y: number) {
    const cells = cellsOf(picked, x, y, dir);
    if (cells.some(([cx, cy]) => cx > 9 || cy > 9)) return;
    const taken = occupy(picked);
    if (cells.some(([cx, cy]) => taken.has(`${cx},${cy}`))) return;
    setPlaced((current) => ({ ...current, [picked]: { x, y, dir } }));
  }

  const draft = FLEET.flatMap((ship) => {
    const spot = placed[ship.id];
    return spot ? [{ id: ship.id, cells: cellsOf(ship.id, spot.x, spot.y, spot.dir), sunk: false }] : [];
  });

  return (
    <section className="max-w-full min-w-0 rounded-[1.4rem] bg-[#16343f] p-3 text-paper sm:p-4 md:p-6">
      <Note banner={view.banner} log={view.log} />
      {view.phase === "placement" && !view.youPlaced ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {FLEET.map((ship) => (
              <button key={ship.id} className={`btn ${picked === ship.id ? "btn-solid" : "btn-line"}`} onClick={() => setPicked(ship.id)}>
                {ship.name} {placed[ship.id] ? "liegt" : ship.len}
              </button>
            ))}
            <button className="btn btn-line" onClick={() => setDir((current) => (current === "h" ? "v" : "h"))}>
              Drehen ({dir === "h" ? "quer" : "hoch"})
            </button>
          </div>
          <Grid title="Deine Flotte" marks={[]} ships={draft} side="own" onCell={place} />
          <button
            className="btn btn-solid"
            disabled={busy || FLEET.some((ship) => !placed[ship.id])}
            onClick={() =>
              onAction({
                type: "place",
                ships: FLEET.map((ship) => ({ id: ship.id, ...placed[ship.id]! })),
              })
            }
          >
            Flotte legen
          </button>
        </div>
      ) : (
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <Grid title="Deine Flotte" marks={view.incoming} ships={view.yourShips} side="own" />
          <Grid
            title="Gegner"
            marks={view.outgoing}
            ships={view.foeShips ?? []}
            side="foe"
            onCell={view.phase === "battle" && view.youAreUp && !busy ? (x, y) => onAction({ type: "shoot", x, y }) : undefined}
          />
        </div>
      )}
    </section>
  );
}
