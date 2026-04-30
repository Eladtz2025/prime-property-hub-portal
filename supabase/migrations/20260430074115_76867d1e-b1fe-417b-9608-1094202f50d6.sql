UPDATE scouted_properties
SET backfill_status = 'pending'
WHERE is_active = true
  AND availability_check_reason = 'needs_enrichment'
  AND (
    features IS NULL 
    OR features = '{}'::jsonb
    OR NOT (features ? 'parking')
    OR NOT (features ? 'elevator')
    OR NOT (features ? 'balcony')
    OR NOT (features ? 'mamad')
  );