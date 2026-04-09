-- ---------- attendance ---------------------------------------------------

create table if not exists public.attendance (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  event_id   text not null, -- stored as text to support recurring IDs like 'id-r1'
  category   text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

alter table public.attendance enable row level security;

drop policy if exists "attendance self read" on public.attendance;
create policy "attendance self read"
  on public.attendance for select
  using (auth.uid() = user_id);

drop policy if exists "attendance self insert" on public.attendance;
create policy "attendance self insert"
  on public.attendance for insert
  with check (auth.uid() = user_id);

drop policy if exists "attendance self delete" on public.attendance;
create policy "attendance self delete"
  on public.attendance for delete
  using (auth.uid() = user_id);

-- index for leaderboard queries
create index if not exists attendance_user_id_idx on public.attendance(user_id);
create index if not exists attendance_event_id_idx on public.attendance(event_id);
