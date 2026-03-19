-- Yad2 URL cleanup round 2
-- Extract item_id as the LAST path segment (before any query string)

-- Step 1: Delete inactive blockers
DELETE FROM scouted_properties
WHERE id IN (
  SELECT sp1.id
  FROM scouted_properties sp1
  WHERE sp1.source = 'yad2'
    AND sp1.is_active = false
    AND EXISTS (
      SELECT 1 FROM scouted_properties sp2
      WHERE sp2.source = 'yad2'
        AND sp2.id != sp1.id
        AND sp2.is_active = true
        AND (regexp_match(split_part(sp2.source_url, '?', 1), '/item/(?:.+/)?([^/]+)$'))[1]
          = (regexp_match(split_part(sp1.source_url, '?', 1), '/item/(?:.+/)?([^/]+)$'))[1]
    )
);

-- Step 2: Normalize active URLs with query params (remove ?...)
UPDATE scouted_properties
SET source_url = split_part(source_url, '?', 1)
WHERE source = 'yad2'
  AND is_active = true
  AND source_url LIKE '%?%'
  AND NOT EXISTS (
    SELECT 1 FROM scouted_properties sp2
    WHERE sp2.source = 'yad2'
      AND sp2.id != scouted_properties.id
      AND sp2.source_url = split_part(scouted_properties.source_url, '?', 1)
  );

-- Step 3: Normalize active URLs with tel-aviv-area prefix
UPDATE scouted_properties
SET source_url = 'https://www.yad2.co.il/realestate/item/' || 
    (regexp_match(source_url, '/item/[^/]+/([^/?]+)'))[1]
WHERE source = 'yad2'
  AND is_active = true
  AND source_url LIKE '%/tel-aviv-area/%'
  AND NOT EXISTS (
    SELECT 1 FROM scouted_properties sp2
    WHERE sp2.source = 'yad2'
      AND sp2.id != scouted_properties.id
      AND sp2.source_url = 'https://www.yad2.co.il/realestate/item/' || 
          (regexp_match(scouted_properties.source_url, '/item/[^/]+/([^/?]+)'))[1]
  );