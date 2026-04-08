-- =============================================================================
-- event_reminders: per-user bookmarks that drive reminder emails.
-- =============================================================================
--
-- `event_id` is stored as text, not as a uuid FK, so the table can hold
-- reminders for events that don't exist as `events` rows (sample data, recurring
-- occurrence ids like "abc-r3", etc.). The reminder email cron only joins on
-- matching uuid events, so non-DB events are silently ignored at send time.

create table if not exists public.event_reminders (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  event_id    text        not null,
  sent_at     timestamptz,
  created_at  timestamptz not null default now(),
  primary key (user_id, event_id)
);

alter table public.event_reminders enable row level security;

drop policy if exists "users can read their own reminders"   on public.event_reminders;
drop policy if exists "users can insert their own reminders" on public.event_reminders;
drop policy if exists "users can delete their own reminders" on public.event_reminders;

create policy "users can read their own reminders"
  on public.event_reminders
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "users can insert their own reminders"
  on public.event_reminders
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users can delete their own reminders"
  on public.event_reminders
  for delete
  to authenticated
  using (user_id = auth.uid());

-- =============================================================================
-- Reminder email cron.
-- =============================================================================
--
-- Runs every minute via pg_cron and POSTs to the `send-event-reminders`
-- Edge Function with the project's service_role key. The function is
-- idempotent: it uses `sent_at` on each reminder row to avoid double-sends.
--
-- Before this works, the project needs these extensions + secrets:
--
--   1. In the Supabase dashboard: Database -> Extensions, enable `pg_cron`
--      and `pg_net`.
--   2. Deploy the Edge Function:
--        supabase functions deploy send-event-reminders --no-verify-jwt
--   3. Set these secrets so the function can send mail and read emails:
--        supabase secrets set RESEND_API_KEY=re_xxx
--        supabase secrets set RESEND_FROM="Glider <events@yourdomain.com>"
--        supabase secrets set SUPABASE_URL=https://<ref>.supabase.co
--        supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
--   4. In this SQL file, replace `YOUR-PROJECT-REF` and the bearer token
--      placeholder below with your real project ref + service_role key, then
--      re-run this migration (or just this block) so pg_cron has the right
--      URL and auth header.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Drop any previous schedule so re-running is idempotent.
do $$
begin
  perform cron.unschedule('send-event-reminders');
exception when others then
  null;
end $$;

select cron.schedule(
  'send-event-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url     := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-event-reminders',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer YOUR-SERVICE-ROLE-KEY'
               ),
    body    := '{}'::jsonb
  );
  $$
);
