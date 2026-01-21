-- Drop the problematic constraint and create a simpler one
ALTER TABLE street_neighborhoods 
DROP CONSTRAINT IF EXISTS street_neighborhoods_unique;

-- Create simpler constraint - only prevent exact duplicates
ALTER TABLE street_neighborhoods 
ADD CONSTRAINT street_neighborhoods_unique_street_city_neighborhood 
UNIQUE(street_name, city, neighborhood);

-- Clear and repopulate
DELETE FROM street_neighborhoods;

-- Insert one entry per street+city+neighborhood combination with range
INSERT INTO street_neighborhoods (street_name, city, neighborhood, number_from, number_to, confidence)
SELECT 
  street_name,
  'תל אביב יפו' as city,
  neighborhood,
  MIN(house_number) as number_from,
  MAX(house_number) as number_to,
  COUNT(*) as confidence
FROM (
  SELECT 
    TRIM(REGEXP_REPLACE(address, '[0-9].*$', '')) as street_name,
    neighborhood,
    CAST(NULLIF(REGEXP_REPLACE(address, '[^0-9]', '', 'g'), '') AS INTEGER) as house_number
  FROM scouted_properties 
  WHERE city = 'תל אביב יפו' 
    AND address IS NOT NULL 
    AND neighborhood IS NOT NULL
    AND TRIM(REGEXP_REPLACE(address, '[0-9].*$', '')) != ''
    AND TRIM(REGEXP_REPLACE(address, '[0-9].*$', '')) !~ '^www\.'
    AND TRIM(REGEXP_REPLACE(address, '[0-9].*$', '')) !~ '^[A-Za-z]+$'
    AND LENGTH(TRIM(REGEXP_REPLACE(address, '[0-9].*$', ''))) > 1
) sub
WHERE house_number IS NOT NULL
GROUP BY street_name, neighborhood;

-- Create index for range queries
DROP INDEX IF EXISTS idx_street_neighborhoods_lookup;
CREATE INDEX idx_street_neighborhoods_range_lookup 
ON street_neighborhoods(street_name, city, number_from, number_to);