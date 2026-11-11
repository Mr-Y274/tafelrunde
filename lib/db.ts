import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { PublicError } from "./errors";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    email_verified_at TIMESTAMPTZ,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower ON users (lower(username))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower ON users (lower(email))`,
  `CREATE TABLE IF NOT EXISTS email_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (requester_id, addressee_id)
  )`,
  `CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    host_id UUID NOT NULL REFERENCES users(id),
    status TEXT NOT NULL CHECK (status IN ('lobby', 'playing', 'finished')),
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    options JSONB NOT NULL DEFAULT '{"tempo":"kurz"}'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS game_players (
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seat INTEGER NOT NULL,
    ready BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (game_id, user_id),
    UNIQUE (game_id, seat)
  )`,
  `CREATE TABLE IF NOT EXISTS game_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (game_id, invitee_id)
  )`,
  `ALTER TABLE email_tokens ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'verify'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false`,
  `CREATE INDEX IF NOT EXISTS game_players_user ON game_players (user_id)`,
  `CREATE INDEX IF NOT EXISTS game_invites_invitee ON game_invites (invitee_id, status)`,
  `CREATE INDEX IF NOT EXISTS friendships_addressee ON friendships (addressee_id, status)`,
  `CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE guests ADD COLUMN IF NOT EXISTS name TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS guests_name_lower ON guests (lower(name))`,
  `CREATE TABLE IF NOT EXISTS guest_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `DO $$
   DECLARE link record;
   BEGIN
     FOR link IN
       SELECT conrelid::regclass::text AS tbl, conname
       FROM pg_constraint
       WHERE contype = 'f'
         AND confrelid = 'users'::regclass
         AND conrelid::regclass::text IN ('games', 'game_players')
     LOOP
       EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', link.tbl, link.conname);
     END LOOP;
   END $$`,
];

type Sql = NeonQueryFunction<false, false>;

let client: Sql | null = null;
let schema: Promise<void> | null = null;

export function db() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new PublicError("Die Datenbank ist noch nicht verbunden.", 500);
  client ??= neon(url);
  return client;
}

export async function migrate() {
  const sql = db();
  for (const statement of STATEMENTS) await sql.query(statement);
}

export function ready() {
  schema ??= migrate().catch((error) => {
    schema = null;
    throw error;
  });
  return schema;
}
