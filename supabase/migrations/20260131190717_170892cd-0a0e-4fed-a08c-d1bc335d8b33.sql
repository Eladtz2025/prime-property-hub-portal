-- Fix Homeless property titles with incorrect "יפו" fallback

-- Step 1: Fix ~159 properties - replace יפו with neighborhoodText from raw_data
UPDATE scouted_properties SET
  title = REPLACE(title, ', יפו', ', ' || (raw_data->>'neighborhoodText')),
  neighborhood = raw_data->>'neighborhoodText'
WHERE source = 'homeless'
  AND is_active = true
  AND title LIKE '%, יפו'
  AND neighborhood IS NULL
  AND raw_data->>'neighborhoodText' IS NOT NULL
  AND raw_data->>'neighborhoodText' != ''
  AND raw_data->>'neighborhoodText' NOT LIKE '%תל אביב%'
  AND raw_data->>'neighborhoodText' != 'יפו';

-- Step 2: Fix ~13 properties where neighborhood exists but title still says יפו
UPDATE scouted_properties SET
  title = REPLACE(title, ', יפו', ', ' || neighborhood)
WHERE source = 'homeless'
  AND is_active = true
  AND title LIKE '%, יפו'
  AND neighborhood IS NOT NULL
  AND neighborhood != 'יפו'
  AND title NOT LIKE '%' || neighborhood || '%';

-- Step 3: Remove "תל אביב יפו" from titles
UPDATE scouted_properties SET
  title = REPLACE(title, ', תל אביב יפו', '')
WHERE source = 'homeless'
  AND is_active = true
  AND title LIKE '%, תל אביב יפו%';

-- Step 4: Remove "תל אביב" from titles (but not "תל אביב יפו")
UPDATE scouted_properties SET
  title = REPLACE(title, ', תל אביב', '')
WHERE source = 'homeless'
  AND is_active = true
  AND title LIKE '%, תל אביב'
  AND title NOT LIKE '%, תל אביב יפו%';