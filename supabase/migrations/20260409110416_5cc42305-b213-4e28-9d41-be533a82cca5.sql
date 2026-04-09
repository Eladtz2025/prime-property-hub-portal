UPDATE scouted_properties
SET 
  backfill_status = 'pending',
  features = '{}'::jsonb
WHERE is_active = true
  AND source IN ('homeless', 'madlan');