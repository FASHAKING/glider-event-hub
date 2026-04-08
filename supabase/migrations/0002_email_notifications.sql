-- =====================================================================
-- Glider Event Hub – email notifications
-- =====================================================================
--
-- Adds 'email' as a valid social_connections platform so signed-up
-- users can receive event notifications at their account email
-- address. The notify-live-events Edge Function reads from this table
-- (looking for platform='email' rows with notifications=true) and
-- delivers via Resend.
--
-- Run this against your Supabase project after 0001_init.sql.
-- =====================================================================

-- 1. Allow 'email' in the platform CHECK constraint -------------------
alter table public.social_connections
  drop constraint if exists social_connections_platform_check;

alter table public.social_connections
  add constraint social_connections_platform_check
  check (platform in ('x', 'telegram', 'discord', 'email'));

-- 2. Update the new-user trigger so every signup auto-opts-in --------
--    to email notifications using the email they signed up with.
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

  insert into public.social_connections (
    user_id, platform, handle, notifications, connected_at
  )
  values (new.id, 'email', new.email, true, now())
  on conflict (user_id, platform) do nothing;

  return new;
end;
$$;

-- 3. Backfill existing users that signed up before this migration ----
insert into public.social_connections (
  user_id, platform, handle, notifications, connected_at
)
select p.id, 'email', p.email, true, now()
from public.profiles p
left join public.social_connections sc
  on sc.user_id = p.id and sc.platform = 'email'
where sc.user_id is null;
