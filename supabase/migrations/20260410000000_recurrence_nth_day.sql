-- Add columns for advanced recurrence patterns:
--   recurrence_days_of_week: integer[] (0=Sun..6=Sat) for weekly multi-day or monthly_nth_day
--   recurrence_week_of_month: integer (1-4 or 5=last) for monthly_nth_day

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS recurrence_days_of_week integer[],
  ADD COLUMN IF NOT EXISTS recurrence_week_of_month integer;
