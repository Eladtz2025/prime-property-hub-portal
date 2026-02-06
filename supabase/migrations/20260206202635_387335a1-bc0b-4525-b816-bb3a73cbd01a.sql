ALTER TABLE public.backfill_progress
  ADD COLUMN IF NOT EXISTS summary_data JSONB DEFAULT '{}'::jsonb;