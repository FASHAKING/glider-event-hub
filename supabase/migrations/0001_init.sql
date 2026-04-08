-- =====================================================================
-- Glider Event Hub – initial schema
-- =====================================================================
--
-- Run this against your Supabase project once (e.g. via the SQL editor
-- in the dashboard, or `supabase db push`).
--
-- It creates:
--   * profiles                – one row per auth.users user
--   * events                  – community-submitted events
--   * reminders               – which users want pings for which events
--   * social_connections      – linked X / Telegram / Discord accounts
--   * notification_log        – append-only history of notifications sent
--   * telegram_link_codes     – short-lived codes used by the bot
--                                to associate a Telegram chat_id with a
--                                profile
--
-- Row-Level Security is enabled on every table and policies are scoped
-- so each user can only see / modify their own rows. Events have a
-- public read policy so anonymous visitors can still browse the hub.
-- =====================================================================

-- ---------- profiles ----------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null,
  email       text not null,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ---------- events ------------------------------------------------------

create table if not exists public.events (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text not null default '',
  host              text not null,
  hosts             text[] not null default '{}'::text[],
  category          text not null,
  starts_at         timestamptz not null,
  duration_minutes  integer not null default 60,
  link              text not null,
  location          text,
  tags              text[] not null default '{}'::text[],
  accent            text default 'mint',
  image_url         text,
  recurrence_freq   text,                       -- 'daily' | 'weekly' | 'biweekly' | 'monthly' | null
  recurrence_count  integer,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists events_starts_at_idx on public.events (starts_at);
create index if not exists events_created_by_idx on public.events (created_by);

alter table public.events enable row level security;

drop policy if exists "events public read" on public.events;
create policy "events public read"
  on public.events for select
  using (true);

drop policy if exists "events authed insert" on public.events;
create policy "events authed insert"
  on public.events for insert
  with check (auth.uid() = created_by);

drop policy if exists "events owner update" on public.events;
create policy "events owner update"
  on public.events for update
  using (auth.uid() = created_by);

drop policy if exists "events owner delete" on public.events;
create policy "events owner delete"
  on public.events for delete
  using (auth.uid() = created_by);

-- keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ---------- reminders ---------------------------------------------------

create table if not exists public.reminders (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  event_id   uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

alter table public.reminders enable row level security;

drop policy if exists "reminders self read" on public.reminders;
create policy "reminders self read"
  on public.reminders for select
  using (auth.uid() = user_id);

drop policy if exists "reminders self insert" on public.reminders;
create policy "reminders self insert"
  on public.reminders for insert
  with check (auth.uid() = user_id);

drop policy if exists "reminders self delete" on public.reminders;
create policy "reminders self delete"
  on public.reminders for delete
  using (auth.uid() = user_id);

-- ---------- social_connections -----------------------------------------

create table if not exists public.social_connections (
  user_id        uuid not null references public.profiles(id) on delete cascade,
  platform       text not null check (platform in ('x', 'telegram', 'discord')),
  handle         text not null,
  /* For Telegram this is the chat_id we DM with the bot. */
  external_id    text,
  notifications  boolean not null default true,
  connected_at   timestamptz not null default now(),
  primary key (user_id, platform)
);

alter table public.social_connections enable row level security;

drop policy if exists "socials self read" on public.social_connections;
create policy "socials self read"
  on public.social_connections for select
  using (auth.uid() = user_id);

drop policy if exists "socials self upsert" on public.social_connections;
create policy "socials self upsert"
  on public.social_connections for insert
  with check (auth.uid() = user_id);

drop policy if exists "socials self update" on public.social_connections;
create policy "socials self update"
  on public.social_connections for update
  using (auth.uid() = user_id);

drop policy if exists "socials self delete" on public.social_connections;
create policy "socials self delete"
  on public.social_connections for delete
  using (auth.uid() = user_id);

-- ---------- notification_log -------------------------------------------

create table if not exists public.notification_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  event_id    uuid references public.events(id) on delete set null,
  kind        text not null,
  title       text not null,
  body        text not null,
  platforms   text[] not null default '{}'::text[],
  sent_at     timestamptz not null default now()
);

create index if not exists notification_log_user_idx on public.notification_log (user_id, sent_at desc);

alter table public.notification_log enable row level security;

drop policy if exists "notif self read" on public.notification_log;
create policy "notif self read"
  on public.notification_log for select
  using (auth.uid() = user_id);

-- ---------- telegram_link_codes ----------------------------------------

create table if not exists public.telegram_link_codes (
  code       text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now()
);

create index if not exists telegram_link_codes_user_idx on public.telegram_link_codes (user_id);

alter table public.telegram_link_codes enable row level security;

drop policy if exists "telegram codes self read" on public.telegram_link_codes;
create policy "telegram codes self read"
  on public.telegram_link_codes for select
  using (auth.uid() = user_id);

drop policy if exists "telegram codes self insert" on public.telegram_link_codes;
create policy "telegram codes self insert"
  on public.telegram_link_codes for insert
  with check (auth.uid() = user_id);

drop policy if exists "telegram codes self delete" on public.telegram_link_codes;
create policy "telegram codes self delete"
  on public.telegram_link_codes for delete
  using (auth.uid() = user_id);

-- ---------- profile auto-create on signup ------------------------------
--
-- When a new user signs up via Supabase auth, automatically create the
-- matching row in public.profiles using their email as a fallback
-- username.
-- ----------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
