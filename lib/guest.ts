import { cookies } from "next/headers";
import { newToken, sha256 } from "./auth";
import { db, ready } from "./db";
import { PublicError } from "./errors";
import { isLoveName, LOVE_NAMES } from "./love-name";

const COOKIE = "tr_guest";
const MONTH = 60 * 60 * 24 * 30;

async function insertGuest() {
  const created = await db()`INSERT INTO guests (name, last_seen) VALUES (NULL, now()) RETURNING id`;
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

export async function touchGuest(id: string) {
  await db()`UPDATE guests SET last_seen = now() WHERE id = ${id}`;
}

function onlineSince() {
  return new Date(Date.now() - 75_000).toISOString();
}

export async function openNames(id: string) {
  await touchGuest(id);
  const since = onlineSince();
  const busy = await db()`
    SELECT lower(name) AS name FROM guests
    WHERE name IS NOT NULL
      AND id <> ${id}
      AND last_seen > ${since}
  `;
  const taken = new Set(busy.map((row) => String((row as { name: string }).name)));
  const mine = await db()`SELECT name FROM guests WHERE id = ${id}`;
  const stored = mine[0] ? String((mine[0] as { name: string | null }).name ?? "") : "";
  const name = isLoveName(stored) ? stored : null;
  return { name, names: LOVE_NAMES.filter((item) => item !== name && !taken.has(item)) };
}

export async function claimName(id: string, raw: string) {
  const name = raw.trim().toLowerCase();
  if (!isLoveName(name)) throw new PublicError("Diesen Namen gibt es nicht.");
  const since = onlineSince();
  await db()`
    UPDATE guests SET name = NULL
    WHERE id <> ${id}
      AND lower(name) = ${name}
      AND (last_seen IS NULL OR last_seen < ${since})
  `;
  try {
    const rows = await db()`UPDATE guests SET name = ${name}, last_seen = now() WHERE id = ${id} RETURNING id`;
    if (!rows.length) throw new PublicError("Der Platz fehlt.");
  } catch (error) {
    const clash = typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505";
    if (clash) throw new PublicError("Der Name ist gerade vergeben.");
    throw error;
  }
  return openNames(id);
}

export async function ensureGuest() {
  await ready();
  const jar = await cookies();
  const current = jar.get(COOKIE)?.value;
  if (current) {
    const existing = await guestFor(current);
    if (existing) {
      await touchGuest(existing);
      return existing;
    }
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
