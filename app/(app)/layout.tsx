import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="wrap flex items-center justify-between gap-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <Link href="/" className="font-display text-[22px] font-bold tracking-tight">
          Tafelrunde
        </Link>
      </header>
      <div className="wrap pb-16">{children}</div>
    </>
  );
}
