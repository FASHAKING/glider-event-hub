-- Allow anyone to read profile display info.
-- Needed for leaderboard (all users visible to unauthenticated visitors)
-- and comment author display.
-- The existing "profiles self read" policy is kept; Postgres evaluates
-- permissive policies with OR, so this simply broadens read access.

drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read"
  on public.profiles for select
  using (true);
