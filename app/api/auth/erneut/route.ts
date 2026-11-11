import { PublicError } from "@/lib/errors";
import { handle } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return handle(async () => {
    throw new PublicError("Es gibt keine Anmeldung. Der Tischcode reicht.", 410);
  });
}
