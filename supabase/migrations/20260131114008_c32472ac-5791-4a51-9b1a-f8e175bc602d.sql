-- Delete scouted properties that are not from Tel Aviv
DELETE FROM scouted_properties 
WHERE city IS NOT NULL 
  AND city NOT IN ('תל אביב יפו', 'תל אביב');