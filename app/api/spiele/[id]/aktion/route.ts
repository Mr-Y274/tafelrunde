import { ensureGuest } from "@/lib/guest";
import { act } from "@/lib/data";
import { PublicError } from "@/lib/errors";
import { handle, json, readJson, sameOrigin } from "@/lib/http";
import { parseCommand } from "@/lib/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    sameOrigin(req);
    const userId = await ensureGuest();
    const { id } = await ctx.params;
    const { version, command } = parseCommand(await readJson(req));
    return json(await act(userId, id, version, command));
  });
}
