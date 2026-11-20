import { TischApp } from "@/components/TischApp";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main>
      <div className="wrap">
        <header className="pt-[max(1.5rem,env(safe-area-inset-top))] pb-6">
          <span className="font-display text-[22px] font-bold tracking-tight">Tafelrunde</span>
        </header>
        <TischApp initial={{ tables: [] }} />
      </div>
    </main>
  );
}
