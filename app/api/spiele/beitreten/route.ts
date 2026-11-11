import { ensureGuest } from "@/lib/guest";
import { joinByCode } from "@/lib/data";
import { PublicError } from "@/lib/errors";
import { handle, json, readJson, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const userId = await ensureGuest();
    const body = (await readJson(req)) as { code?: string };
    if (!body.code) throw new PublicError("Der Tischcode fehlt.");
    return json(await joinByCode(userId, body.code));
  });
}
