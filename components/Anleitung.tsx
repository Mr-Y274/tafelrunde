"use client";

import { gameInfo } from "@/lib/games/catalog";
import { GUIDES } from "@/lib/games/guides";
import type { GameId } from "@/lib/games/types";
import { useEffect, useId, useRef, useState } from "react";

export function Anleitung({ id, tone = "line" }: { id: GameId; tone?: "line" | "solid" }) {
  const info = gameInfo(id);
  const guide = GUIDES[id];
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  if (!info) return null;

  return (
    <>
      <button className={tone === "solid" ? "btn btn-solid" : "btn btn-line"} type="button" onClick={() => setOpen(true)}>
        Anleitung
      </button>
      {open ? (
        <dialog
          ref={dialog}
          className="anleitung panel"
          aria-labelledby={titleId}
          onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target === dialog.current) setOpen(false);
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="kicker text-cinnabar">{info.players}</p>
              <h2 id={titleId} className="font-display text-4xl">
                {info.name}
              </h2>
            </div>
            <button className="btn btn-line" type="button" onClick={() => setOpen(false)}>
              Schließen
            </button>
          </div>
          <p className="mt-3 text-lg">{info.blurb}</p>
          <div className="mt-6 space-y-5">
            {guide.map((section) => (
              <section key={section.title}>
                <h3 className="font-display text-2xl">{section.title}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {section.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </dialog>
      ) : null}
    </>
  );
}
