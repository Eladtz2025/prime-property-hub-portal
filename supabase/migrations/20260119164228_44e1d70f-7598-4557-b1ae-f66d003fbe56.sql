-- Fix historical data: mark inflated values as NULL for scraping sources

-- Fix runs with exactly 200 (missed by previous migration with > 200)
UPDATE scout_runs 
SET properties_found = NULL
WHERE source IN ('yad2', 'madlan', 'homeless')
  AND properties_found = 200;

-- Fix scraping runs that were overwritten by matching (properties_found > 50 is unrealistic for a single scan)
UPDATE scout_runs 
SET properties_found = NULL
WHERE source IN ('yad2', 'madlan', 'homeless')
  AND properties_found > 50;