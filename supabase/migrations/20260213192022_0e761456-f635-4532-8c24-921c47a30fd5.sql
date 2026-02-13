
-- 1. Delete same-listing-ID duplicates (keep clean URL, delete the one with query params)
WITH same_listing_pairs AS (
  SELECT sp1.id as id1, sp2.id as id2,
    sp1.source_url as url1, sp2.source_url as url2
  FROM scouted_properties sp1
  JOIN scouted_properties sp2 ON sp1.duplicate_group_id = sp2.duplicate_group_id 
    AND sp1.id < sp2.id AND sp1.source = sp2.source
  WHERE sp1.is_active = true AND sp2.is_active = true
    AND sp1.source = 'yad2'
    AND substring(sp1.source_url from '/item/([a-zA-Z0-9]+)') = substring(sp2.source_url from '/item/([a-zA-Z0-9]+)')
),
to_delete AS (
  SELECT 
    CASE 
      WHEN url1 NOT LIKE '%?%' THEN id2
      WHEN url2 NOT LIKE '%?%' THEN id1
      ELSE id2
    END as delete_id
  FROM same_listing_pairs
)
DELETE FROM scouted_properties WHERE id IN (SELECT delete_id FROM to_delete);

-- 2. Ungroup false-positive duplicate pairs where floors don't match (same source)
-- First, identify groups that contain same-source members with different floors
WITH bad_groups AS (
  SELECT DISTINCT sp1.duplicate_group_id
  FROM scouted_properties sp1
  JOIN scouted_properties sp2 ON sp1.duplicate_group_id = sp2.duplicate_group_id 
    AND sp1.id < sp2.id AND sp1.source = sp2.source
  WHERE sp1.is_active = true AND sp2.is_active = true
    AND sp1.floor IS NOT NULL AND sp2.floor IS NOT NULL
    AND sp1.floor != sp2.floor
    AND sp1.duplicate_group_id IS NOT NULL
)
-- Reset these groups so they can be re-evaluated
UPDATE scouted_properties
SET duplicate_group_id = NULL,
    is_primary_listing = true,
    duplicate_detected_at = NULL,
    dedup_checked_at = NULL
WHERE duplicate_group_id IN (SELECT duplicate_group_id FROM bad_groups);
