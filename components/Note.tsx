"use client";

import { useArrivals } from "./motion";

export function Note({ banner }: { banner: string; log?: string[] }) {
  const fresh = useArrivals([banner]);
  return (
    <div>
      <p className={`banner text-lg ${fresh.has(banner) ? "rise" : ""}`} aria-live="polite">
        {banner}
      </p>
    </div>
  );
}
