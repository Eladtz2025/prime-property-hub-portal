
-- Fix remaining stragglers
UPDATE scouted_properties SET neighborhood = 'רמת אביב' WHERE is_active = true AND neighborhood LIKE 'רמת אביב ג%';
UPDATE scouted_properties SET neighborhood = 'יפו' WHERE is_active = true AND neighborhood LIKE '%עג''מי%';
UPDATE scouted_properties SET neighborhood = 'יפו' WHERE is_active = true AND neighborhood = 'המושבה האמריקאית-גרמנית';
UPDATE scouted_properties SET neighborhood = 'צהלה' WHERE is_active = true AND neighborhood LIKE 'גני צהלה%תל אביב%';
UPDATE scouted_properties SET neighborhood = 'פלורנטין' WHERE is_active = true AND neighborhood LIKE 'פלורנטין%תל אביב%';
UPDATE scouted_properties SET neighborhood = 'צפון ישן' WHERE is_active = true AND neighborhood = 'צפון_ישן';
UPDATE scouted_properties SET neighborhood = 'תכנית ל׳' WHERE is_active = true AND neighborhood = 'למד';
UPDATE scouted_properties SET neighborhood = NULL WHERE is_active = true AND neighborhood = 'אין';
UPDATE scouted_properties SET neighborhood = 'בבלי' WHERE is_active = true AND neighborhood LIKE '%נווה דן%';

-- Fill newly nulled from street_neighborhoods
UPDATE scouted_properties sp
SET neighborhood = sn.neighborhood
FROM street_neighborhoods sn
WHERE sp.is_active = true
  AND sp.neighborhood IS NULL
  AND sp.city = sn.city
  AND sp.address IS NOT NULL
  AND trim(regexp_replace(sp.address, '[0-9].*$', '')) = sn.street_name;
