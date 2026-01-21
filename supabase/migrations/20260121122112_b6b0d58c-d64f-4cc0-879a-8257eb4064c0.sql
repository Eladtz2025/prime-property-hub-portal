-- Fix the 3 remaining unmapped properties with neighborhood assignments
UPDATE scouted_properties 
SET neighborhood = 'יפו' 
WHERE city = 'תל אביב יפו' 
  AND address LIKE 'שמעון הצדיק%' 
  AND neighborhood IS NULL;

UPDATE scouted_properties 
SET neighborhood = 'צפון_ישן' 
WHERE city = 'תל אביב יפו' 
  AND address LIKE 'דב ממזריץ%' 
  AND neighborhood IS NULL;

UPDATE scouted_properties 
SET neighborhood = 'מרכז_העיר' 
WHERE city = 'תל אביב יפו' 
  AND address LIKE '%לוויד גורג%' 
  AND neighborhood IS NULL;

-- Add street name variations to improve future matching
INSERT INTO street_neighborhoods (city, street_name, neighborhood, source)
VALUES 
  ('תל אביב יפו', 'לוויד גורג', 'מרכז_העיר', 'manual'),
  ('תל אביב יפו', 'לויד גורג', 'מרכז_העיר', 'manual'),
  ('תל אביב יפו', 'דב ממזריץ', 'צפון_ישן', 'manual')
ON CONFLICT DO NOTHING;