-- One-time run to sync all existing groups with is_primary_listing
WITH ranked AS (
  SELECT
    id,
    duplicate_group_id,
    ROW_NUMBER() OVER (
      PARTITION BY duplicate_group_id
      ORDER BY
        (CASE WHEN is_private = true THEN 2 
              WHEN is_private = false THEN 1 
              ELSE 0 END) DESC,
        updated_at DESC NULLS LAST,
        price ASC NULLS LAST,
        created_at ASC
    ) AS rn
  FROM scouted_properties
  WHERE is_active = true
    AND duplicate_group_id IS NOT NULL
)
UPDATE scouted_properties sp
SET is_primary_listing = (ranked.rn = 1)
FROM ranked
WHERE sp.id = ranked.id;