UPDATE scouted_properties
SET backfill_status = 'pending'
WHERE source = 'yad2'
  AND is_active = true
  AND (description IS NULL OR trim(description) = '')
  AND backfill_status IN ('completed', 'not_needed');