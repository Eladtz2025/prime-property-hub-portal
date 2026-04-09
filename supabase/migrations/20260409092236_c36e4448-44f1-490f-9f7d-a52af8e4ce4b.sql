UPDATE scouted_properties
SET backfill_status = 'pending'
WHERE is_active = true
  AND backfill_status = 'completed'
  AND (features IS NULL OR features = '{}'::jsonb);