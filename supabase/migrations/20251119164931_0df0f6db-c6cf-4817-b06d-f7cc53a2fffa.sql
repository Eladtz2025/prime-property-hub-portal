-- Keep only 3 most recent Tali test records, delete the rest
DELETE FROM contact_leads 
WHERE name = 'Tali Silberberg' 
AND email = 'Tali2884@gmail.com'
AND id NOT IN (
  SELECT id 
  FROM contact_leads 
  WHERE name = 'Tali Silberberg' 
  AND email = 'Tali2884@gmail.com'
  ORDER BY created_at DESC 
  LIMIT 3
);