"use client";

import type { MemoView } from "@/lib/games/types";
import { Note } from "../Note";
import { useArrivals } from "../motion";

export function MemoBoard({ view, busy, onAction }: { view: MemoView; busy: boolean; onAction: (body: Record<string, unknown>) => Promise<void> }) {
  const live = view.youAreUp && !busy;
  const fresh = useArrivals(view.tiles.map((tile, index) => `${index}:${tile.hidden ? "zu" : tile.mark}:${tile.owner ?? ""}`));
  return (
    <section className="panel p-4 md:p-6">
      <Note banner={view.banner} log={view.log} />
      <ul className="mt-3 flex flex-wrap gap-2">
        {view.scores.map((row) => (
          <li key={row.id} className={`rounded-full px-3 py-1 text-sm ${row.id === view.turnId ? "bg-cinnabar text-paper" : "bg-ink/5"}`}>
            {row.name} · {row.score}
          </li>
        ))}
      </ul>
      <div className="mt-5 grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${view.cols}, minmax(0, 1fr))` }}>
        {view.tiles.map((tile, index) => (
          <button
            key={index}
            className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-xl [container-type:size] sm:rounded-2xl ${tile.hidden ? "bg-[#e7b7c6] text-[#8d314c]" : "bg-paper text-ink"} ${tile.owner ? "ring-2 ring-moss" : ""} ${fresh.has(`${index}:${tile.hidden ? "zu" : tile.mark}:${tile.owner ?? ""}`) ? "flip" : ""}`}
            disabled={!live || view.phase !== "flip" || !tile.hidden}
            onClick={() => onAction({ type: "memo-flip", index })}
            type="button"
            aria-label={tile.hidden ? "Verdecktes Tierchen" : tile.animal}
          >
            <span className="leading-none text-[86cqmin]">{tile.hidden ? "💗" : tile.mark}</span>
            {tile.owner ? <small className="absolute inset-x-0 bottom-0 truncate px-0.5 text-[0.55rem] leading-tight">{tile.owner}</small> : null}
          </button>
        ))}
      </div>
      {view.phase === "show" && view.youAreUp ? (
        <button className="btn btn-solid mt-4" disabled={busy} onClick={() => onAction({ type: "memo-hide" })} type="button">
          Zudecken
        </button>
      ) : null}
    </section>
  );
}
