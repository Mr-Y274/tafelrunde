import { claimName, ensureGuest, openNames } from "@/lib/guest";
import { PublicError } from "@/lib/errors";
import { handle, json, readJson, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const id = await ensureGuest();
    return json(await openNames(id));
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const id = await ensureGuest();
    const body = (await readJson(req)) as { name?: string };
    if (!body.name) throw new PublicError("Der Name fehlt.");
    return json(await claimName(id, body.name));
  });
}
