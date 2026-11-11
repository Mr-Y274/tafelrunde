import { cookies } from "next/headers";
import { newToken, sha256 } from "./auth";
import { db, ready } from "./db";
import { rollLoveName } from "./love-name";

const COOKIE = "tr_guest";
const MONTH = 60 * 60 * 24 * 30;

async function insertGuest() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const name = rollLoveName();
    try {
      const created = await db()`INSERT INTO guests (name) VALUES (${name}) RETURNING id`;
      return String((created[0] as { id: string }).id);
    } catch (error) {
      const clash = typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505";
      if (!clash) throw error;
    }
  }
  const name = `${rollLoveName()}${Math.floor(Math.random() * 90 + 10)}`;
  const created = await db()`INSERT INTO guests (name) VALUES (${name}) RETURNING id`;
  return String((created[0] as { id: string }).id);
}

async function guestFor(token: string) {
  const rows = await db()`
    SELECT guest_id FROM guest_sessions
    WHERE token_hash = ${sha256(token)} AND expires_at > now()
  `;
  const row = rows[0] as { guest_id: string } | undefined;
  return row?.guest_id ?? null;
}

export async function readGuest() {
  await ready();
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return guestFor(token);
}

export async function ensureGuest() {
  await ready();
  const jar = await cookies();
  const current = jar.get(COOKIE)?.value;
  if (current) {
    const existing = await guestFor(current);
    if (existing) return existing;
  }
  const id = await insertGuest();
  const token = newToken();
  const expires = new Date(Date.now() + MONTH * 1000).toISOString();
  await db()`INSERT INTO guest_sessions (guest_id, token_hash, expires_at) VALUES (${id}, ${sha256(token)}, ${expires})`;
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MONTH,
  });
  return id;
}
