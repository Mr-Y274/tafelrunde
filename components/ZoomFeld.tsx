"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "tr_zoom";
const MIN = 20;
const MAX = 150;

export function ZoomFeld({ children }: { children: React.ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(75);
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  function apply(value: number) {
    const next = Math.min(MAX, Math.max(MIN, Math.round(value / 5) * 5));
    setZoom(next);
    localStorage.setItem(KEY, String(next));
  }

  useEffect(() => {
    const saved = Number(localStorage.getItem(KEY));
    if (saved >= MIN && saved <= MAX) setZoom(saved);
  }, []);

  useEffect(() => {
    const node = inner.current;
    if (!node) return;
    const read = () => setNatural({ w: node.scrollWidth, h: node.scrollHeight });
    read();
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function fit() {
    const box = frame.current;
    const node = inner.current;
    if (!box || !node) return;
    const width = node.scrollWidth;
    const height = node.scrollHeight;
    if (width < 8 || height < 8) return;
    const top = box.getBoundingClientRect().top;
    const availableW = box.clientWidth;
    const availableH = window.innerHeight - Math.max(top, 0) - 12;
    if (availableW < 40 || availableH < 80) return;
    apply(Math.min(availableW / width, availableH / height) * 100);
  }

  const scale = zoom / 100;

  return (
    <div>
      <div className="mb-2 flex items-center gap-3 text-sm">
        <span className="shrink-0">Größe</span>
        <input
          className="zoom"
          type="range"
          min={MIN}
          max={MAX}
          step={5}
          value={zoom}
          aria-label="Spielfeldgröße"
          onChange={(event) => apply(Number(event.target.value))}
        />
        <span className="w-12 shrink-0 text-right">{zoom}%</span>
      </div>
      <button className="btn btn-line mb-3 w-full" type="button" onClick={fit}>
        Passend
      </button>
      <div ref={frame} className="overflow-hidden" style={{ height: natural.h > 0 ? Math.ceil(natural.h * scale) : undefined }}>
        <div ref={inner} style={{ width: "max-content", minWidth: "100%", transform: `scale(${scale})`, transformOrigin: "top center" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
