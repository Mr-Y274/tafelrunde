import { GATE_COOKIE, validGate } from "@/lib/gate";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const OPEN = new Set(["/eingang", "/impressum", "/datenschutz", "/nutzung"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/api/eingang" || OPEN.has(pathname)) return NextResponse.next();
  if (await validGate(request.cookies.get(GATE_COOKIE)?.value)) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Der Code fehlt." }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/eingang";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
