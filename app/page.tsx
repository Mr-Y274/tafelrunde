import { TischApp } from "@/components/TischApp";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main>
      <div className="wrap">
        <header className="py-6">
          <span className="font-display text-2xl">Tafelrunde</span>
        </header>
        <TischApp initial={{ tables: [] }} />
      </div>
    </main>
  );
}
