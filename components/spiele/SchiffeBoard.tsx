"use client";

import { FLEET, fleetMeta } from "@/lib/games/fleet";
import type { SchiffeView, ShipId } from "@/lib/games/types";
import { useEffect, useState } from "react";
import { Note } from "../Note";

const letters = "ABCDEFGHIJ".split("");

function cellsOf(id: ShipId, x: number, y: number, dir: "h" | "v") {
  const cells: [number, number][] = [];
  for (let step = 0; step < fleetMeta(id).len; step++) {
    cells.push([x + (dir === "h" ? step : 0), y + (dir === "v" ? step : 0)]);
  }
  return cells;
}

function tone(mark: { hit: boolean } | undefined, ship: { sunk: boolean } | undefined) {
  if (ship?.sunk) return "bg-moss";
  if (mark?.hit) return "bg-cinnabar";
  if (mark) return "bg-[#9a938a]";
  if (ship) return "bg-[#e7d7b8]";
  return "bg-[#1b4d5c]";
}

function Grid({
  title,
  marks,
  ships,
  onCell,
}: {
  title: string;
  marks: { x: number; y: number; hit: boolean }[];
  ships: { cells: [number, number][]; sunk: boolean }[];
  onCell?: (x: number, y: number) => void;
}) {
  return (
    <div>
      <h2 className="mb-2 font-display text-2xl">{title}</h2>
      <div className="grid grid-cols-[1.2rem_repeat(10,minmax(0,1fr))] gap-1 text-center text-xs">
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
              const state = ship?.sunk ? "versenkt" : mark?.hit ? "Treffer" : mark ? "Wasser" : ship ? "Schiff" : "frei";
              return (
                <button
                  key={label}
                  type="button"
                  aria-label={`${label}, ${state}`}
                  disabled={!onCell}
                  onClick={() => onCell?.(x, y)}
                  className={`aspect-square rounded-sm border border-white/15 ${tone(mark, ship)}`}
                />
              );
            })}
          </div>
        ))}
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
    return spot ? [{ cells: cellsOf(ship.id, spot.x, spot.y, spot.dir), sunk: false }] : [];
  });

  return (
    <section className="rounded-[1.4rem] bg-[#16343f] p-4 text-paper md:p-6">
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
              Drehen ({dir === "h" ? "quer" : "hoch"}, Taste R)
            </button>
          </div>
          <Grid title="Deine Flotte" marks={[]} ships={draft} onCell={place} />
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
          <Grid title="Deine Flotte" marks={view.incoming} ships={view.yourShips} />
          <Grid
            title="Gegner"
            marks={view.outgoing}
            ships={view.foeShips ?? []}
            onCell={view.phase === "battle" && view.youAreUp && !busy ? (x, y) => onAction({ type: "shoot", x, y }) : undefined}
          />
        </div>
      )}
    </section>
  );
}
