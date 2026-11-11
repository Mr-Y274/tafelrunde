import { ensureGuest } from "@/lib/guest";
import { createTable } from "@/lib/data";
import { PublicError } from "@/lib/errors";
import { handle, json, readJson, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const userId = await ensureGuest();
    const body = (await readJson(req)) as { type?: string };
    if (!body.type) throw new PublicError("Das Spiel fehlt.");
    return json(await createTable(userId, body.type));
  });
}
