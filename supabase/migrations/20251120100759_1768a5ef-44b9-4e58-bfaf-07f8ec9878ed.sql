-- Delete all Elad Zabari test records
DELETE FROM contact_leads 
WHERE email = 'eladtz@gmail.com';

-- Delete the lowercase "tali" duplicate
DELETE FROM contact_leads 
WHERE name = 'tali' AND email = 'tali2884@gmail.com';

-- Keep only the most recent Tali Silberberg record
DELETE FROM contact_leads 
WHERE email = 'tali2884@gmail.com'
AND id NOT IN (
  SELECT id 
  FROM contact_leads 
  WHERE email = 'tali2884@gmail.com'
  ORDER BY created_at DESC 
  LIMIT 1
);