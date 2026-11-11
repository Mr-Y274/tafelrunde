import { ensureGuest } from "@/lib/guest";
import { loadTisch } from "@/lib/data";
import { handle, json } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const userId = await ensureGuest();
    return json(await loadTisch(userId));
  });
}
