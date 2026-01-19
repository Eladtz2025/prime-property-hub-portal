-- Final cleanup: Mark inflated historical values as NULL (unknown)
-- This fixes data integrity issues from before the code was corrected

-- Mark new_properties as NULL where values are unrealistically high for scraping sources
UPDATE scout_runs 
SET new_properties = NULL
WHERE source IN ('yad2', 'madlan', 'homeless')
  AND new_properties > 50;

-- Mark properties_found as NULL where values are unrealistically high for scraping sources
UPDATE scout_runs 
SET properties_found = NULL
WHERE source IN ('yad2', 'madlan', 'homeless')
  AND properties_found > 200;