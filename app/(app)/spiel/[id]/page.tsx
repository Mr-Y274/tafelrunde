import { SpielClient } from "@/components/SpielClient";
import { loadTable } from "@/lib/data";
import { PublicError } from "@/lib/errors";
import { readGuest } from "@/lib/guest";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SpielPage({ params }: { params: Promise<{ id: string }> }) {
  const guestId = await readGuest();
  const { id } = await params;
  if (!guestId) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-4xl">Der Code fehlt.</h1>
        <p>Setz dich auf der Startseite mit dem Tischcode dazu.</p>
        <Link className="btn btn-solid" href="/">
          Zur Startseite
        </Link>
      </div>
    );
  }
  try {
    const initial = await loadTable(guestId, id);
    return <SpielClient initial={initial} />;
  } catch (error) {
    if (error instanceof PublicError && (error.status === 404 || error.status === 403)) {
      return (
        <div className="space-y-4">
          <h1 className="font-display text-4xl">Dieser Tisch geht über den Code.</h1>
          <Link className="btn btn-solid" href="/">
            Zur Startseite
          </Link>
        </div>
      );
    }
    throw error;
  }
}
