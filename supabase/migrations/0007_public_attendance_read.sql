-- Allow anyone to read attendance records.
-- Needed so the leaderboard can display event counts, scores, and badges
-- for all users, including to unauthenticated visitors.

drop policy if exists "attendance public read" on public.attendance;
create policy "attendance public read"
  on public.attendance for select
  using (true);
