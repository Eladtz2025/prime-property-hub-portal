
-- Delete non-residential listings (dogs, cats, offices, stores, parking, storage)
DELETE FROM scouted_properties 
WHERE title ILIKE '%כלב%' 
   OR title ILIKE '%חתול%'
   OR title ILIKE '%משרד%' 
   OR title ILIKE '%חנות%'
   OR title ILIKE '%חניה%'
   OR title ILIKE '%מחסן%';

-- Normalize existing Tel Aviv city names to standard format
UPDATE scouted_properties 
SET city = 'תל אביב יפו' 
WHERE city LIKE '%תל אביב%' AND city != 'תל אביב יפו';
