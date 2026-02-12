
-- Add backfill_status column to scouted_properties
ALTER TABLE public.scouted_properties 
ADD COLUMN IF NOT EXISTS backfill_status text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.scouted_properties.backfill_status IS 'Backfill processing status: NULL=needs processing, completed=done, failed=error, not_needed=already full';

-- Create filtered index for efficient querying
CREATE INDEX IF NOT EXISTS idx_scouted_properties_backfill_pending
ON public.scouted_properties (id)
WHERE is_active = true AND (backfill_status IS NULL OR backfill_status = 'failed');

-- Mark properties that already have ALL data filled as 'not_needed'
-- This covers properties processed today and historically complete ones
UPDATE public.scouted_properties
SET backfill_status = 'not_needed'
WHERE is_active = true
  AND rooms IS NOT NULL
  AND price IS NOT NULL
  AND size IS NOT NULL
  AND is_private IS NOT NULL
  AND features IS NOT NULL 
  AND features != '{}'::jsonb
  AND address IS NOT NULL 
  AND address ~ '\d{1,3}';

-- Mark inactive properties so they won't be queried
UPDATE public.scouted_properties
SET backfill_status = 'not_needed'
WHERE is_active = false
  AND backfill_status IS NULL;
