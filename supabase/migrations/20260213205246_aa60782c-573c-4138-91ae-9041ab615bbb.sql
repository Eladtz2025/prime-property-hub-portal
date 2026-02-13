
-- Step 1: Merge fragmented groups (same address+city+floor in multiple groups)
WITH fragmented AS (
  SELECT address, city, floor,
    array_agg(DISTINCT duplicate_group_id) as groups,
    min(duplicate_group_id::text)::uuid as keep_group
  FROM scouted_properties
  WHERE duplicate_group_id IS NOT NULL AND is_active = true
  GROUP BY address, city, floor
  HAVING count(DISTINCT duplicate_group_id) > 1
)
UPDATE scouted_properties sp
SET duplicate_group_id = f.keep_group
FROM fragmented f
WHERE sp.address = f.address AND sp.city = f.city
  AND ((sp.floor IS NULL AND f.floor IS NULL) OR sp.floor = f.floor)
  AND sp.duplicate_group_id = ANY(f.groups)
  AND sp.duplicate_group_id != f.keep_group;

-- Step 2: Cleanup single-property groups
SELECT cleanup_orphan_duplicate_groups();

-- Step 3: Recompute winners for all merged groups
SELECT recompute_duplicate_winners();
