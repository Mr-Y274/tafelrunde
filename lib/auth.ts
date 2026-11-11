import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, ready } from "./db";
import { PublicError } from "./errors";

const scrypt = promisify(scryptCallback);
const COOKIE = "tr_session";
const MONTH = 60 * 60 * 24 * 30;

export type SessionUser = { id: string; username: string; email: string; admin: boolean };

type UserRow = {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  email_verified_at: string | null;
};

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function newToken() {
  return randomBytes(32).toString("base64url");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${buf.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [kind, salt, hex] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hex) return false;
  const buf = (await scrypt(password, salt, 64)) as Buffer;
  const got = Buffer.from(hex, "hex");
  if (got.length !== buf.length) return false;
  return timingSafeEqual(buf, got);
}

export function validUsername(value: string) {
  return /^[A-Za-z0-9_-]{3,20}$/.test(value);
}

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 120;
}

async function findByEmail(email: string) {
  const sql = db();
  const rows = await sql`SELECT id, username, email, password_hash, email_verified_at FROM users WHERE lower(email) = ${email.toLowerCase()}`;
  return (rows[0] as UserRow | undefined) ?? null;
}

export async function findByUsername(username: string) {
  await ready();
  const sql = db();
  const rows = await sql`SELECT id, username, email, password_hash, email_verified_at FROM users WHERE lower(username) = ${username.toLowerCase()}`;
  return (rows[0] as UserRow | undefined) ?? null;
}

export async function createAccount(input: { username: string; email: string; password: string }) {
  await ready();
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  if (!validUsername(username)) throw new PublicError("Der Name braucht 3 bis 20 Zeichen: Buchstaben, Zahlen, Unterstrich oder Bindestrich.");
  if (!validEmail(email)) throw new PublicError("Die Mailadresse stimmt nicht.");
  if (input.password.length < 8 || input.password.length > 72) throw new PublicError("Das Passwort braucht 8 bis 72 Zeichen.");
  const sql = db();
  const taken = await sql`SELECT username, email FROM users WHERE lower(username) = ${username.toLowerCase()} OR lower(email) = ${email}`;
  const clash = taken[0] as { username: string; email: string } | undefined;
  if (clash) {
    if (clash.email.toLowerCase() === email) throw new PublicError("Diese Mail hat schon einen Platz.");
    throw new PublicError("Dieser Benutzername ist vergeben.");
  }
  const passwordHash = await hashPassword(input.password);
  const created = await sql`
    INSERT INTO users (username, email, password_hash)
    VALUES (${username}, ${email}, ${passwordHash})
    RETURNING id, email
  `;
  const user = created[0] as { id: string; email: string };
  const token = newToken();
  await sql`
    INSERT INTO email_tokens (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${sha256(token)}, now() + interval '24 hours')
  `;
  return { id: user.id, email: user.email, token };
}

export async function deleteAccount(id: string) {
  await ready();
  await db()`DELETE FROM users WHERE id = ${id}`;
}

export async function confirmEmail(token: string) {
  await ready();
  if (!token || token.length < 20) throw new PublicError("Der Link ist unvollständig.");
  const sql = db();
  const rows = await sql`SELECT user_id FROM email_tokens WHERE token_hash = ${sha256(token)} AND purpose = 'verify' AND expires_at > now()`;
  const userId = (rows[0] as { user_id: string } | undefined)?.user_id;
  if (!userId) throw new PublicError("Der Link ist abgelaufen oder schon benutzt.");
  await sql`UPDATE users SET email_verified_at = coalesce(email_verified_at, now()) WHERE id = ${userId}`;
  await sql`DELETE FROM email_tokens WHERE user_id = ${userId} AND purpose = 'verify'`;
}

export async function refreshVerification(email: string) {
  await ready();
  const user = await findByEmail(email.trim().toLowerCase());
  if (!user) throw new PublicError("Zu dieser Adresse gibt es keinen Account.");
  if (user.email_verified_at) throw new PublicError("Die Adresse ist schon bestätigt. Du kannst dich anmelden.");
  const sql = db();
  const recent = await sql`SELECT id FROM email_tokens WHERE user_id = ${user.id} AND purpose = 'verify' AND created_at > now() - interval '60 seconds'`;
  if (recent.length > 0) throw new PublicError("Warte einen Moment, dann schick die Mail noch einmal.");
  await sql`DELETE FROM email_tokens WHERE user_id = ${user.id} AND purpose = 'verify'`;
  const token = newToken();
  await sql`
    INSERT INTO email_tokens (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${sha256(token)}, now() + interval '24 hours')
  `;
  return { email: user.email, token };
}

export async function requestPasswordReset(email: string) {
  await ready();
  const user = await findByEmail(email.trim().toLowerCase());
  if (!user) return null;
  const sql = db();
  const recent = await sql`SELECT id FROM email_tokens WHERE user_id = ${user.id} AND purpose = 'reset' AND created_at > now() - interval '60 seconds'`;
  if (recent.length > 0) throw new PublicError("Warte einen Moment, dann schick die Mail noch einmal.");
  await sql`DELETE FROM email_tokens WHERE user_id = ${user.id} AND purpose = 'reset'`;
  const token = newToken();
  await sql`
    INSERT INTO email_tokens (user_id, token_hash, purpose, expires_at)
    VALUES (${user.id}, ${sha256(token)}, 'reset', now() + interval '1 hour')
  `;
  return { email: user.email, token };
}

export async function resetPassword(token: string, password: string) {
  await ready();
  if (!token || token.length < 20) throw new PublicError("Der Link ist unvollständig.");
  if (password.length < 8 || password.length > 72) throw new PublicError("Das Passwort braucht 8 bis 72 Zeichen.");
  const sql = db();
  const rows = await sql`SELECT user_id FROM email_tokens WHERE token_hash = ${sha256(token)} AND purpose = 'reset' AND expires_at > now()`;
  const userId = (rows[0] as { user_id: string } | undefined)?.user_id;
  if (!userId) throw new PublicError("Der Link ist abgelaufen oder schon benutzt.");
  const passwordHash = await hashPassword(password);
  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;
  await sql`DELETE FROM email_tokens WHERE user_id = ${userId} AND purpose = 'reset'`;
  await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
}

export async function openSession(email: string, password: string) {
  await ready();
  const user = await findByEmail(email.trim().toLowerCase());
  const ok = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !ok) throw new PublicError("Mail oder Passwort stimmt nicht.");
  if (!user.email_verified_at) throw new PublicError("Bestätige zuerst deine Mail.", 403, "unverified");
  const token = newToken();
  await db()`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${sha256(token)}, now() + interval '30 days')
  `;
  return token;
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MONTH,
  });
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db()`DELETE FROM sessions WHERE token_hash = ${sha256(token)}`;
  jar.delete(COOKIE);
}

export async function getUser(): Promise<SessionUser | null> {
  await ready();
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db()`
    SELECT u.id, u.username, u.email, u.is_admin
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${sha256(token)} AND s.expires_at > now() AND u.email_verified_at IS NOT NULL
  `;
  const row = rows[0] as { id: string; username: string; email: string; is_admin: boolean } | undefined;
  return row ? { id: row.id, username: row.username, email: row.email, admin: row.is_admin } : null;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/anmelden");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.admin) redirect("/tisch");
  return user;
}
