"use client";

import { useEffect, useRef, useState } from "react";

export function useArrivals(keys: readonly string[], enter = false) {
  const seen = useRef<Set<string> | null>(null);
  const [hot, setHot] = useState<ReadonlySet<string>>(() => new Set());
  const signature = keys.join("\u0000");

  useEffect(() => {
    const next = keys.filter(Boolean);
    const previous = seen.current;
    seen.current = new Set(next);
    const born = previous ? next.filter((key) => !previous.has(key)) : enter ? next : [];
    if (born.length === 0) return;
    setHot(new Set(born));
    const timer = window.setTimeout(() => setHot(new Set()), 450);
    return () => window.clearTimeout(timer);
  }, [signature]);

  return hot;
}
