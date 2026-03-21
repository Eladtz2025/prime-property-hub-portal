
-- 1. Add 'checked' to the status check constraint
ALTER TABLE scouted_properties DROP CONSTRAINT scouted_properties_status_check;
ALTER TABLE scouted_properties ADD CONSTRAINT scouted_properties_status_check 
  CHECK (status = ANY (ARRAY['new'::text, 'matched'::text, 'imported'::text, 'archived'::text, 'inactive'::text, 'duplicate_cross_source'::text, 'checked'::text]));

-- 2. Update existing properties that were already checked but have no matches
UPDATE scouted_properties 
SET status = 'checked' 
WHERE is_active = true 
  AND status = 'new' 
  AND (matched_leads IS NULL OR matched_leads = '[]'::jsonb);

-- 3. Update the availability check function to include 'checked' status
CREATE OR REPLACE FUNCTION public.get_properties_needing_availability_check(
  p_first_recheck_days integer DEFAULT 8, 
  p_recurring_recheck_days integer DEFAULT 2, 
  p_min_days_before_check integer DEFAULT 3, 
  p_fetch_limit integer DEFAULT 150
)
RETURNS TABLE(id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH eligible AS (
    SELECT sp.id, sp.source,
           ROW_NUMBER() OVER (PARTITION BY sp.source ORDER BY sp.availability_checked_at ASC NULLS FIRST) as rn
    FROM scouted_properties sp
    WHERE sp.is_active = true
      AND sp.status IN ('matched', 'new', 'checked')
      AND sp.availability_retry_count < 2
      AND (sp.first_seen_at AT TIME ZONE 'Asia/Jerusalem')::date
          <= (now() AT TIME ZONE 'Asia/Jerusalem')::date - p_min_days_before_check
      AND (
        sp.availability_checked_at IS NULL
        OR (sp.availability_check_count = 1
            AND (sp.availability_checked_at AT TIME ZONE 'Asia/Jerusalem')::date
                <= (now() AT TIME ZONE 'Asia/Jerusalem')::date - p_first_recheck_days)
        OR (sp.availability_check_count >= 2
            AND (sp.availability_checked_at AT TIME ZONE 'Asia/Jerusalem')::date
                <= (now() AT TIME ZONE 'Asia/Jerusalem')::date - p_recurring_recheck_days)
      )
  )
  SELECT eligible.id
  FROM eligible
  ORDER BY eligible.rn ASC, eligible.source ASC
  LIMIT p_fetch_limit;
$$;
