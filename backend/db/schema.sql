-- Smart Bio GPT - Supabase / Postgres schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- chats
-- ---------------------------------------------------------------------------
create table if not exists public.chats (
    id                 uuid primary key default gen_random_uuid(),
    user_id            uuid not null references auth.users (id) on delete cascade,
    title              text not null default 'New research session',
    protein_accession  text,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now()
);
create index if not exists chats_user_updated_idx on public.chats (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
    id          uuid primary key default gen_random_uuid(),
    chat_id     uuid not null references public.chats (id) on delete cascade,
    role        text not null check (role in ('user', 'assistant', 'system')),
    content     text not null,
    degraded    boolean not null default false,
    created_at  timestamptz not null default now()
);
create index if not exists messages_chat_created_idx on public.messages (chat_id, created_at);

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users (id) on delete cascade,
    accession   text not null,
    name        text,
    gene        text,
    organism    text,
    created_at  timestamptz not null default now(),
    unique (user_id, accession)
);
create index if not exists favorites_user_idx on public.favorites (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- search_history
-- ---------------------------------------------------------------------------
create table if not exists public.search_history (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users (id) on delete cascade,
    query       text not null,
    accession   text,
    created_at  timestamptz not null default now()
);
create index if not exists search_history_user_idx on public.search_history (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- The API uses the service-role key (bypasses RLS) but scopes every query by
-- user_id. These policies are the safety net if the anon key is ever used, or
-- if the client talks to Supabase directly.
-- ---------------------------------------------------------------------------
alter table public.chats          enable row level security;
alter table public.messages       enable row level security;
alter table public.favorites      enable row level security;
alter table public.search_history enable row level security;

drop policy if exists "own chats" on public.chats;
create policy "own chats" on public.chats
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own messages" on public.messages;
create policy "own messages" on public.messages
    for all using (
        exists (select 1 from public.chats c where c.id = messages.chat_id and c.user_id = auth.uid())
    ) with check (
        exists (select 1 from public.chats c where c.id = messages.chat_id and c.user_id = auth.uid())
    );

drop policy if exists "own favorites" on public.favorites;
create policy "own favorites" on public.favorites
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own history" on public.search_history;
create policy "own history" on public.search_history
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger for chats
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists chats_touch_updated_at on public.chats;
create trigger chats_touch_updated_at
    before update on public.chats
    for each row execute function public.touch_updated_at();
