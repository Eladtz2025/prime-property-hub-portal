
-- Update scouted_properties neighborhoods based on street_neighborhoods lookup
-- Match by extracting street name from address (remove house number, prefixes)
UPDATE scouted_properties sp
SET neighborhood = sn.neighborhood
FROM street_neighborhoods sn
WHERE sn.city = 'תל אביב יפו'
  AND sp.city LIKE '%תל אביב%'
  AND sp.is_active = true
  AND sn.street_name = trim(regexp_replace(
    regexp_replace(split_part(sp.address, ',', 1), '\s*\d+[א-ת]?\s*$', ''),
    '^\d+[\s,]*', ''
  ))
  AND sp.neighborhood IS DISTINCT FROM sn.neighborhood;
