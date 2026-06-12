-- Add a campus column to the workers table so the attendance form
-- can capture which campus each worker belongs to.

alter table public.workers
  add column if not exists campus text;
