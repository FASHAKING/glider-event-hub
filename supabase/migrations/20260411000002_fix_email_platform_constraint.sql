-- =====================================================================
-- Glider Event Hub – ensure 'email' is allowed in social_connections
-- =====================================================================
--
-- Some production databases may not have migration 0002 applied, so the
-- social_connections_platform_check constraint is still restricted to
-- ('x', 'telegram', 'discord') and clients get:
--
--   new row for relation "social_connections" violates check constraint
--   "social_connections_platform_check"
--
-- This migration drops and re-adds the constraint to include 'email'.
-- Safe to run multiple times.
-- =====================================================================

alter table public.social_connections
  drop constraint if exists social_connections_platform_check;

alter table public.social_connections
  add constraint social_connections_platform_check
  check (platform in ('x', 'telegram', 'discord', 'email'));
