UPDATE scouted_properties
SET backfill_status = 'pending'
WHERE source = 'yad2'
  AND backfill_status = 'completed'
  AND is_active = true
  AND status IN ('checked','matched','new')
  AND (features->>'parking') = 'true'
  AND NOT (features ? 'parkingSpots');