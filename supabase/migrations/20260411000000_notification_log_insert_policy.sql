-- =============================================================================
-- Fix: allow authenticated users to insert their own notification_log rows.
--
-- The original schema (0001_init.sql) only created a SELECT policy on
-- notification_log. The client-side dispatcher in notifications.ts inserts
-- records via the anon/public client, but those inserts silently failed
-- because there was no INSERT policy. Edge Functions bypass RLS via the
-- service_role key, so server-side inserts were unaffected.
-- =============================================================================

drop policy if exists "notif self insert" on public.notification_log;
create policy "notif self insert"
  on public.notification_log for insert
  with check (auth.uid() = user_id);
