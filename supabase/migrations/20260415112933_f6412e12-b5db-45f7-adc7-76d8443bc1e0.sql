UPDATE scouted_properties 
SET backfill_status = 'pending' 
WHERE is_active = true 
  AND backfill_status = 'completed' 
  AND source IN ('madlan', 'homeless', 'yad2');