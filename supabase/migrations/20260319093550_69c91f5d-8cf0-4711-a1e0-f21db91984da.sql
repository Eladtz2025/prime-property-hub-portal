-- Deactivate same-source duplicates (same address/city/rooms/floor/price/source/type)
-- Keep the oldest record in each group, deactivate the rest
WITH duplicates AS (
  SELECT id, 
    ROW_NUMBER() OVER (
      PARTITION BY address, city, rooms, floor, price, source, property_type
      ORDER BY created_at ASC
    ) as rn
  FROM scouted_properties
  WHERE is_active = true
    AND address IS NOT NULL AND rooms IS NOT NULL 
    AND floor IS NOT NULL AND price IS NOT NULL
)
UPDATE scouted_properties
SET is_active = false, 
    status = 'inactive',
    availability_checked_at = now(),
    availability_check_reason = 'merged_same_source_duplicate',
    updated_at = now()
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Clean orphan duplicate groups
SELECT cleanup_orphan_duplicate_groups();