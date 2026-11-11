import { db, ready } from "./db";
import { PublicError } from "./errors";

export type ManagedAccount = {
  id: string;
  username: string;
  email: string;
  admin: boolean;
  verifiedAt: string | null;
  createdAt: string;
};

export async function listAccounts(): Promise<ManagedAccount[]> {
  await ready();
  const rows = await db()`
    SELECT id, username, email, is_admin, email_verified_at, created_at
    FROM users
    ORDER BY created_at ASC
  `;
  return rows.map((row) => {
    const account = row as {
      id: string;
      username: string;
      email: string;
      is_admin: boolean;
      email_verified_at: string | null;
      created_at: string;
    };
    return {
      id: account.id,
      username: account.username,
      email: account.email,
      admin: account.is_admin,
      verifiedAt: account.email_verified_at,
      createdAt: account.created_at,
    };
  });
}

export async function removeAccount(actorId: string, targetId: string) {
  await ready();
  if (actorId === targetId) throw new PublicError("Den eigenen Account löschst du nicht von hier.");
  const sql = db();
  const rows = await sql`SELECT is_admin FROM users WHERE id = ${targetId}`;
  const target = rows[0] as { is_admin: boolean } | undefined;
  if (!target) throw new PublicError("Diesen Account gibt es nicht.");
  if (target.is_admin) throw new PublicError("Einen Admin löschst du nicht von hier.");
  await sql`DELETE FROM games WHERE host_id = ${targetId}`;
  await sql`DELETE FROM users WHERE id = ${targetId}`;
}

export async function confirmAccount(targetId: string) {
  await ready();
  const rows = await db()`
    UPDATE users
    SET email_verified_at = coalesce(email_verified_at, now())
    WHERE id = ${targetId}
    RETURNING id
  `;
  if (!rows[0]) throw new PublicError("Diesen Account gibt es nicht.");
}
