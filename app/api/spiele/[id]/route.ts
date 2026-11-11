import { ensureGuest } from "@/lib/guest";
import { loadTable } from "@/lib/data";
import { handle, json } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const userId = await ensureGuest();
    const { id } = await ctx.params;
    return json(await loadTable(userId, id));
  });
}
