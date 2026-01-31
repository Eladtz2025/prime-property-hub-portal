-- Delete duplicate records from same source, keeping only the oldest one
-- This addresses same-source duplicates (e.g., same Homeless listing appearing 8 times)
WITH duplicates_to_delete AS (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY source, address, rooms, price, floor 
        ORDER BY created_at ASC
      ) as row_num
    FROM scouted_properties
    WHERE is_active = true
    AND address IS NOT NULL
    AND rooms IS NOT NULL
    AND price IS NOT NULL
  ) ranked
  WHERE row_num > 1
)
DELETE FROM scouted_properties 
WHERE id IN (SELECT id FROM duplicates_to_delete);