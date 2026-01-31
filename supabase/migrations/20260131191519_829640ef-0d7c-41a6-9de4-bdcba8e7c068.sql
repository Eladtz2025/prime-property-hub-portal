-- Fix 1: Update titles that still have "ביפו" with valid raw_data.neighborhoodText
UPDATE scouted_properties SET
  title = REPLACE(title, 'ביפו', 'ב' || (raw_data->>'neighborhoodText')),
  neighborhood = raw_data->>'neighborhoodText'
WHERE source = 'homeless'
  AND is_active = true
  AND title LIKE '%ביפו%'
  AND (neighborhood IS NULL OR neighborhood = '')
  AND raw_data->>'neighborhoodText' IS NOT NULL
  AND raw_data->>'neighborhoodText' != ''
  AND raw_data->>'neighborhoodText' NOT LIKE '%תל אביב%'
  AND raw_data->>'neighborhoodText' != 'יפו';

-- Fix 2: Populate neighborhood from raw_data where it's null
UPDATE scouted_properties SET
  neighborhood = raw_data->>'neighborhoodText'
WHERE source = 'homeless'
  AND is_active = true
  AND (neighborhood IS NULL OR neighborhood = '')
  AND raw_data->>'neighborhoodText' IS NOT NULL
  AND raw_data->>'neighborhoodText' != ''
  AND raw_data->>'neighborhoodText' NOT IN ('תל אביב יפו', 'תל אביב', 'יפו');

-- Fix 3: Build address for properties with neighborhood but no address
UPDATE scouted_properties SET
  address = neighborhood || ', תל אביב יפו'
WHERE source = 'homeless'
  AND is_active = true
  AND (address IS NULL OR address = '')
  AND neighborhood IS NOT NULL
  AND neighborhood != ''
  AND city = 'תל אביב יפו';