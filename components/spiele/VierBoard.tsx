"use client";

import type { VierView } from "@/lib/games/types";
import { Note } from "../Note";
import { useArrivals } from "../motion";

export function VierBoard({ view, busy, onAction }: { view: VierView; busy: boolean; onAction: (body: Record<string, unknown>) => Promise<void> }) {
  const cols = view.cols || 7;
  const height = view.height || 6;
  const landed = useArrivals([view.last == null ? "" : `stein-${view.last}`]);
  return (
    <section className="panel p-4 md:p-6">
      <Note banner={view.banner} log={view.log} />
      <ul className="mt-3 flex flex-wrap gap-2">
        {view.rows.map((row) => (
          <li key={row.id} className={`rounded-full px-3 py-1 text-sm ${row.id === view.turnId ? "bg-cinnabar text-paper" : "bg-ink/5"}`}>
            {row.mark} {row.name}
          </li>
        ))}
      </ul>
      <div className="mx-auto mt-5 grid max-w-3xl gap-1 sm:gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }, (_, col) => (
          <button key={col} className="grid gap-1 sm:gap-2" disabled={!view.youAreUp || busy || view.phase === "done"} onClick={() => onAction({ type: "vier-drop", col })} type="button" aria-label={`Spalte ${col + 1}`}>
            {Array.from({ length: height }, (_, row) => {
              const spot = (height - 1 - row) * cols + col;
              const owner = view.cells[spot];
              const won = view.win.includes(spot);
              const latest = view.last === spot;
              return (
                <span
                  key={spot}
                  className={`flex aspect-square items-center justify-center overflow-hidden rounded-full [container-type:size] ${owner == null ? "bg-ink/10" : won ? "bg-[#f3d2dc]" : "bg-paper"} ${landed.has(`stein-${spot}`) ? "drop" : ""}`}
                  style={latest ? { outline: "3px solid #b06bff", outlineOffset: "2px" } : undefined}
                >
                  {owner == null ? "" : <span className="leading-none text-[68cqmin]">{view.rows[owner]?.mark ?? "💗"}</span>}
                </span>
              );
            })}
          </button>
        ))}
      </div>
    </section>
  );
}
