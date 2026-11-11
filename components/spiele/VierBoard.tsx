"use client";

import type { VierView } from "@/lib/games/types";
import { Note } from "../Note";

const MARK = ["💗", "💛"];

export function VierBoard({ view, busy, onAction }: { view: VierView; busy: boolean; onAction: (body: Record<string, unknown>) => Promise<void> }) {
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
      <div className="mx-auto mt-5 grid max-w-xl grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, col) => (
          <button key={col} className="grid gap-2" disabled={!view.youAreUp || busy || view.phase === "done"} onClick={() => onAction({ type: "vier-drop", col })} type="button" aria-label={`Spalte ${col + 1}`}>
            {Array.from({ length: 6 }, (_, row) => {
              const spot = (5 - row) * 7 + col;
              const owner = view.cells[spot];
              const won = view.win.includes(spot);
              return (
                <span key={spot} className={`flex aspect-square items-center justify-center rounded-full text-2xl ${owner == null ? "bg-ink/10" : won ? "bg-[#f3d2dc]" : "bg-paper"}`}>
                  {owner == null ? "" : MARK[owner] ?? "💗"}
                </span>
              );
            })}
          </button>
        ))}
      </div>
    </section>
  );
}
