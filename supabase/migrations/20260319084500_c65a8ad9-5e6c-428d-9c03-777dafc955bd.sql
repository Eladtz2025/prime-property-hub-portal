
-- Comprehensive yad2 URL duplicate cleanup
-- Must handle unique constraints on (source, source_id) and (source, source_url)

-- Step 1: Deactivate ALL yad2 duplicates (active AND inactive) keeping oldest per item_id
-- This handles the case where the clean URL already exists as an inactive record
WITH yad2_ids AS (
  SELECT 
    id, source_url, is_active, created_at,
    (regexp_match(source_url, '/realestate/item/(?:[^/]+/)?([a-zA-Z0-9]+)', 'i'))[1] AS item_id
  FROM scouted_properties
  WHERE source = 'yad2'
),
keepers AS (
  -- Keep the oldest per item_id, preferring active ones
  SELECT DISTINCT ON (item_id) id, item_id 
  FROM yad2_ids 
  WHERE item_id IS NOT NULL 
  ORDER BY item_id, is_active DESC, created_at ASC
),
to_deactivate AS (
  SELECT y.id
  FROM yad2_ids y
  WHERE y.item_id IN (SELECT item_id FROM yad2_ids GROUP BY item_id HAVING COUNT(*) > 1)
    AND y.id NOT IN (SELECT id FROM keepers)
    AND y.is_active = true  -- only deactivate currently active ones
)
UPDATE scouted_properties
SET is_active = false,
    status = 'inactive',
    availability_checked_at = now(),
    availability_check_reason = 'url_duplicate_cleanup'
WHERE id IN (SELECT id FROM to_deactivate);

-- Step 2: Delete truly redundant inactive duplicates that block URL normalization
-- (inactive records with tel-aviv-area/ prefix where the clean URL version also exists)
WITH yad2_ids AS (
  SELECT 
    id, source_url, is_active,
    (regexp_match(source_url, '/realestate/item/(?:[^/]+/)?([a-zA-Z0-9]+)', 'i'))[1] AS item_id
  FROM scouted_properties
  WHERE source = 'yad2' AND is_active = false
),
clean_urls AS (
  SELECT item_id FROM yad2_ids
  WHERE source_url = 'https://www.yad2.co.il/realestate/item/' || item_id
),
to_delete AS (
  SELECT y.id FROM yad2_ids y
  JOIN clean_urls c ON y.item_id = c.item_id
  WHERE y.source_url != 'https://www.yad2.co.il/realestate/item/' || y.item_id
)
DELETE FROM scouted_properties WHERE id IN (SELECT id FROM to_delete);

-- Step 3: Now safely normalize source_url for remaining active yad2 properties
-- Only update those whose normalized URL doesn't already exist
UPDATE scouted_properties sp
SET source_url = 'https://www.yad2.co.il/realestate/item/' || 
    (regexp_match(sp.source_url, '/realestate/item/(?:[^/]+/)?([a-zA-Z0-9]+)', 'i'))[1]
WHERE sp.source = 'yad2'
  AND sp.is_active = true
  AND sp.source_url != 'https://www.yad2.co.il/realestate/item/' || 
      (regexp_match(sp.source_url, '/realestate/item/(?:[^/]+/)?([a-zA-Z0-9]+)', 'i'))[1]
  AND NOT EXISTS (
    SELECT 1 FROM scouted_properties sp2
    WHERE sp2.source = 'yad2'
      AND sp2.id != sp.id
      AND sp2.source_url = 'https://www.yad2.co.il/realestate/item/' || 
          (regexp_match(sp.source_url, '/realestate/item/(?:[^/]+/)?([a-zA-Z0-9]+)', 'i'))[1]
  );
