import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="wrap flex items-center justify-between gap-4 py-5">
        <Link href="/" className="font-display text-2xl">
          Tafelrunde
        </Link>
      </header>
      <div className="wrap pb-16">{children}</div>
    </>
  );
}
