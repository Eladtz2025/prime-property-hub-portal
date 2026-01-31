-- Disable properties with broken source URLs (project pages, search pages)
-- These lead to 404 errors when users click on them
-- Using 'inactive' status which is a valid status value

UPDATE scouted_properties
SET is_active = false,
    status = 'inactive'
WHERE is_active = true
AND (
  -- Yad2 broken patterns
  (source = 'yad2' AND (
    source_url LIKE '%/yad1/project/%'
    OR source_url LIKE '%/yad1/%'  
    OR source_url LIKE '%forsale?%'
    OR source_url LIKE '%forrent?%'
  ))
  -- Madlan broken patterns  
  OR (source = 'madlan' AND (
    source_url LIKE '%/projects/%'
    OR source_url NOT LIKE '%/listings/%'
  ))
);