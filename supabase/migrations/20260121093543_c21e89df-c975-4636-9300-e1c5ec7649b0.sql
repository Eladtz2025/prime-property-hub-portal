-- Step 1: Add number range columns
ALTER TABLE street_neighborhoods 
ADD COLUMN number_from INTEGER,
ADD COLUMN number_to INTEGER;

-- Step 2: Drop the old unique constraint
ALTER TABLE street_neighborhoods 
DROP CONSTRAINT IF EXISTS street_neighborhoods_street_name_city_key;

-- Step 3: Create new unique constraint including ranges
ALTER TABLE street_neighborhoods 
ADD CONSTRAINT street_neighborhoods_unique 
UNIQUE(street_name, city, number_from, number_to);