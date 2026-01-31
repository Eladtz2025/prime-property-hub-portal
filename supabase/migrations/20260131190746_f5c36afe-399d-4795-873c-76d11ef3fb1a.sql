-- Fix remaining יפו titles:
-- 1. Where neighborhoodText is "תל אביב יפו" - remove ", יפו" entirely
-- 2. Where neighborhoodText is empty but neighborhood is NULL - remove ", יפו" 
-- Don't touch properties where neighborhood IS "יפו" (actually in Jaffa)

-- Step 1: Remove ", יפו" when neighborhoodText is "תל אביב יפו"
UPDATE scouted_properties SET
  title = REPLACE(title, ', יפו', '')
WHERE source = 'homeless'
  AND is_active = true
  AND title LIKE '%, יפו'
  AND neighborhood IS NULL
  AND (raw_data->>'neighborhoodText' = 'תל אביב יפו' OR raw_data->>'neighborhoodText' = '');

-- Step 2: Use streetText as neighborhood where we have street but no neighborhood
UPDATE scouted_properties SET
  neighborhood = raw_data->>'streetText'
WHERE source = 'homeless'
  AND is_active = true
  AND neighborhood IS NULL
  AND raw_data->>'streetText' IS NOT NULL
  AND raw_data->>'streetText' != ''
  AND city = 'תל אביב יפו';