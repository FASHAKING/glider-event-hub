-- ---------- admin role on profiles --------------------------------------

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ---------- featured/pinned events -------------------------------------

alter table public.events
  add column if not exists is_featured boolean not null default false;

-- ---------- admin RLS overrides ----------------------------------------
-- Admins can update and delete ANY event, not just their own.

drop policy if exists "events admin update" on public.events;
create policy "events admin update"
  on public.events for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "events admin delete" on public.events;
create policy "events admin delete"
  on public.events for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
