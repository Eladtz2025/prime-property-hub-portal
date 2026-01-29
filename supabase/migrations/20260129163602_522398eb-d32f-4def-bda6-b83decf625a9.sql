-- Update rooms from title - only valid room counts (1-15)
UPDATE scouted_properties
SET rooms = (
  CASE 
    WHEN title ~ '([0-9]+\.5) חדר' THEN (regexp_match(title, '([0-9]+\.5) חדר'))[1]::numeric
    WHEN title ~ '([0-9]+) חדר' THEN (regexp_match(title, '([0-9]+) חדר'))[1]::numeric
    ELSE NULL
  END
)
WHERE rooms IS NULL 
AND title IS NOT NULL 
AND title ~ '[0-9]+\.?[0-9]* חדר'
AND (
  (title ~ '([0-9]+\.5) חדר' AND (regexp_match(title, '([0-9]+\.5) חדר'))[1]::numeric <= 15)
  OR
  (title ~ '([0-9]+) חדר' AND NOT title ~ '([0-9]+\.5) חדר' AND (regexp_match(title, '([0-9]+) חדר'))[1]::numeric <= 15)
);

-- Fix broker names stored as cities
UPDATE scouted_properties
SET city = NULL
WHERE city IN (
  'יוקרה אסטייט',
  'Big Land Realestate', 
  'גילינסקי השקעות ונכסים',
  'Mare Homes',
  'גדי רימקס מעלות',
  'MORE נדלן',
  'Goldin Assets',
  'Liron'
);