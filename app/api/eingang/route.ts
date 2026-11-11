import { GATE_COOKIE, GATE_MAX_AGE, codeMatches, sealGate } from "@/lib/gate";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!/^\d{4}$/.test(code) || !codeMatches(code)) {
    return NextResponse.json({ error: "Der Code stimmt nicht." }, { status: 401 });
  }
  let token = "";
  try {
    token = await sealGate();
  } catch {
    return NextResponse.json({ error: "Der Zugang ist gerade nicht bereit." }, { status: 500 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(GATE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GATE_MAX_AGE,
  });
  return response;
}
