-- =============================================================================
-- Add global "notify me when any event goes live" toggle to user profiles.
--
-- Users with this flag set to true will receive live-event notifications for
-- ALL events, not just ones they explicitly set reminders on. The
-- notify-live-events Edge Function checks this column alongside the reminders
-- table when building the recipient list.
-- =============================================================================

alter table public.profiles
  add column if not exists notify_all_live boolean not null default false;
