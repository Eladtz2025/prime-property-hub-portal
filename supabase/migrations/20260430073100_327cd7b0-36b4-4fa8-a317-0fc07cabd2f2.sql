-- Reset availability_checked_at for active properties missing key feature data,
-- so the existing backfill/availability checker picks them up with priority.
UPDATE scouted_properties
SET 
  availability_checked_at = NULL,
  availability_check_reason = 'needs_enrichment'
WHERE is_active = true
  AND status IN ('matched', 'new', 'checked')
  AND (
    features IS NULL
    OR NOT (features ? 'parking')
    OR NOT (features ? 'elevator')
    OR NOT (features ? 'balcony')
    OR NOT (features ? 'mamad')
  )
  AND (availability_check_reason IS NULL OR availability_check_reason != 'needs_enrichment');