-- ---------- comments -----------------------------------------------------

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  event_id    text not null,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  username    text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists comments_event_id_idx on public.comments(event_id);
create index if not exists comments_created_at_idx on public.comments(created_at);

alter table public.comments enable row level security;

-- Anyone (including anonymous visitors) can read comments
drop policy if exists "comments public read" on public.comments;
create policy "comments public read"
  on public.comments for select
  using (true);

-- Authenticated users can insert their own comments
drop policy if exists "comments authed insert" on public.comments;
create policy "comments authed insert"
  on public.comments for insert
  with check (auth.uid() = user_id);
