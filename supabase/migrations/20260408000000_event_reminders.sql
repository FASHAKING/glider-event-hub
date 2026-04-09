-- =============================================================================
-- Reminder email delivery: adds `sent_at` to the existing reminders table and
-- schedules a pg_cron job that POSTs to the `send-event-reminders` Edge
-- Function every minute so users get an email right before the event starts.
-- =============================================================================
--
-- The base `public.reminders` table is created in 0001_init.sql. Here we
-- only bolt on the delivery tracking column + scheduler. The Edge Function
-- reads `sent_at IS NULL` + event start window to decide what to mail.

alter table public.reminders
  add column if not exists sent_at timestamptz;

create index if not exists reminders_sent_at_idx
  on public.reminders (sent_at);

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
