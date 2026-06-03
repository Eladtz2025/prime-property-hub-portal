-- Add backfill_attempts counter to scouted_properties (Fix 4: feature-data completeness)
-- Enables capped retry of failed backfills instead of stranding features as null forever.
-- Mirrors the existing availability_retry_count / phone_extraction_attempts counters.
-- Applied to production 2026-06-03 via Supabase dashboard SQL editor; this file records it.
ALTER TABLE public.scouted_properties ADD COLUMN IF NOT EXISTS backfill_attempts integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.scouted_properties.backfill_attempts IS 'Number of backfill scrape attempts; capped retry (MAX 3) before terminal failed status (Fix 4)';
