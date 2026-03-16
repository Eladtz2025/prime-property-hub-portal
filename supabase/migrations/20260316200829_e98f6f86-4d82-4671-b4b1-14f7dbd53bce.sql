
-- Step 1: Fill missing neighborhoods from address comma parts (Madlan-style addresses like "רחוב 27, שכונה")
-- This uses a mapping of known neighborhood names to normalized values
WITH comma_neighborhoods AS (
  SELECT 
    sp.id,
    trim(split_part(sp.address, ',', 2)) as raw_neighborhood
  FROM scouted_properties sp
  WHERE sp.is_active = true
    AND (sp.neighborhood IS NULL OR sp.neighborhood = '')
    AND sp.address LIKE '%,%'
    AND trim(split_part(sp.address, ',', 2)) != ''
    AND trim(split_part(sp.address, ',', 2)) !~ '^\d+$'
),
-- Match against street_neighborhoods to get normalized neighborhood values
matched_comma AS (
  SELECT DISTINCT ON (cn.id)
    cn.id,
    sn.neighborhood_normalized
  FROM comma_neighborhoods cn
  JOIN street_neighborhoods sn 
    ON lower(trim(cn.raw_neighborhood)) = lower(trim(sn.neighborhood))
    OR lower(trim(cn.raw_neighborhood)) = lower(trim(sn.neighborhood_normalized))
  WHERE sn.neighborhood_normalized IS NOT NULL AND sn.neighborhood_normalized != ''
)
UPDATE scouted_properties sp
SET neighborhood = mc.neighborhood_normalized
FROM matched_comma mc
WHERE sp.id = mc.id;

-- Step 2: Fill missing neighborhoods from street name lookup
-- Extract street name from address (remove house numbers), then match against street_neighborhoods
WITH street_extracted AS (
  SELECT 
    sp.id,
    sp.city,
    -- Extract street name: remove house number (digits at end or beginning)
    trim(regexp_replace(
      regexp_replace(
        split_part(sp.address, ',', 1),  -- Take part before comma
        '^\d+\s*', '', 'g'              -- Remove leading numbers
      ),
      '\s*\d+.*$', '', 'g'              -- Remove trailing numbers and everything after
    )) as street_name
  FROM scouted_properties sp
  WHERE sp.is_active = true
    AND (sp.neighborhood IS NULL OR sp.neighborhood = '')
    AND sp.address IS NOT NULL AND sp.address != ''
),
matched_streets AS (
  SELECT DISTINCT ON (se.id)
    se.id,
    sn.neighborhood_normalized
  FROM street_extracted se
  JOIN street_neighborhoods sn 
    ON lower(trim(se.street_name)) = lower(trim(sn.street_name))
    AND (
      se.city = sn.city
      OR (se.city LIKE '%תל אביב%' AND sn.city LIKE '%תל אביב%')
    )
  WHERE sn.neighborhood_normalized IS NOT NULL 
    AND sn.neighborhood_normalized != ''
    AND se.street_name != ''
    AND length(se.street_name) >= 2
  ORDER BY se.id, sn.confidence DESC NULLS LAST
)
UPDATE scouted_properties sp
SET neighborhood = ms.neighborhood_normalized
FROM matched_streets ms
WHERE sp.id = ms.id;
