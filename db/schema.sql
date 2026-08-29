-- Smart Bio GPT - self-hosted Postgres schema.
-- Applied by the one-shot `migrator` service on every `docker compose up`.
-- Fully idempotent: safe to run repeatedly.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ---------------------------------------------------------------------------
-- users  (owned by auth-service)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email          citext UNIQUE NOT NULL,
    name           text NOT NULL,
    password_hash  text,                       -- NULL for Google-only accounts
    google_id      text UNIQUE,
    avatar_url     text,
    email_verified boolean NOT NULL DEFAULT false,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- refresh_tokens  (owned by auth-service) - stored as SHA-256 hashes only
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  text NOT NULL UNIQUE,
    expires_at  timestamptz NOT NULL,
    revoked_at  timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_expiry_idx ON refresh_tokens (expires_at);

-- ---------------------------------------------------------------------------
-- chats / messages  (owned by chat-service)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chats (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title              text NOT NULL DEFAULT 'New research session',
    protein_accession  text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chats_user_updated_idx ON chats (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id     uuid NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    role        text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content     text NOT NULL,
    degraded    boolean NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_chat_created_idx ON messages (chat_id, created_at);

-- ---------------------------------------------------------------------------
-- favorites / search_history  (owned by chat-service, written by bio-service)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorites (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    accession   text NOT NULL,
    name        text,
    gene        text,
    organism    text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, accession)
);
CREATE INDEX IF NOT EXISTS favorites_user_idx ON favorites (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS search_history (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    query       text NOT NULL,
    accession   text,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS search_history_user_idx ON search_history (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chats_touch_updated_at ON chats;
CREATE TRIGGER chats_touch_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS users_touch_updated_at ON users;
CREATE TRIGGER users_touch_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
