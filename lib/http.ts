import { PublicError } from "./errors";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export async function handle(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof PublicError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: "Etwas ist schiefgelaufen." }, { status: 500 });
  }
}

export async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new PublicError("Unlesbare Anfrage.");
  }
}

export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return;
  let sent: URL;
  try {
    sent = new URL(origin);
  } catch {
    throw new PublicError("Unerlaubte Herkunft.", 403);
  }
  if (sent.host !== host) throw new PublicError("Unerlaubte Herkunft.", 403);
}

export function originOf(req: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
