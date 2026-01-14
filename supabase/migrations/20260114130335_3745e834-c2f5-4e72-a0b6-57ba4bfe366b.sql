-- Fix all preferred_neighborhoods to use canonical values (value format like צפון_ישן)
-- Also fix any remaining city variations

-- Fix Zur Binyamini: צפון הישן -> צפון_ישן
UPDATE contact_leads
SET preferred_neighborhoods = ARRAY['צפון_ישן']
WHERE id = '9e2423a2-d751-4109-bd55-4465ae34e9cc';

-- Fix דור וליה: מרכז -> מרכז_העיר
UPDATE contact_leads
SET preferred_neighborhoods = ARRAY['מרכז_העיר']
WHERE id = '3b7006bc-c872-475f-9ce1-380b2f9f024f';

-- Fix בר: הצפון הישן -> צפון_ישן  
UPDATE contact_leads
SET preferred_neighborhoods = ARRAY['צפון_ישן']
WHERE id = 'b6bb9d82-745a-41cb-b247-08529e2cf3a5';

-- Fix תומר והגר נחום: צפון הישן -> צפון_ישן
UPDATE contact_leads
SET preferred_neighborhoods = ARRAY['צפון_ישן']
WHERE id = 'acb3f1a6-0e2d-4466-99d5-3cb16d039d73';

-- Fix בנדתה: צפון הישן, צפון החדש -> צפון_ישן, צפון_חדש
UPDATE contact_leads
SET preferred_neighborhoods = ARRAY['צפון_ישן', 'צפון_חדש']
WHERE id = 'd44a5f01-675a-443c-9673-dd68cf0ef1dc';

-- Fix נילי: צפון הישן / צפון החדש -> צפון_ישן, צפון_חדש
UPDATE contact_leads
SET preferred_neighborhoods = ARRAY['צפון_ישן', 'צפון_חדש']
WHERE id = '8589c36a-b4ed-4321-8c83-e0d98530cd79';

-- Fix Aylon Morley: OldNorth -> צפון_ישן
UPDATE contact_leads
SET preferred_neighborhoods = ARRAY['צפון_ישן']
WHERE id = 'c44558e7-41fb-480e-a840-bf7ff0291509';

-- Fix Uri: לב העיר -> מרכז_העיר
UPDATE contact_leads
SET preferred_neighborhoods = ARRAY['מרכז_העיר']
WHERE id = 'c5eacbd4-125e-4a67-b7ee-8f2f289d8c8e';

-- Fix Alexander: תל-אביב -> תל אביב יפו (city)
UPDATE contact_leads
SET preferred_cities = ARRAY['תל אביב יפו']
WHERE id = 'a456c7e8-d410-4d53-ba2c-2c72e17b0c18';

-- Fix נויה: Telaviv -> תל אביב יפו (city)
UPDATE contact_leads
SET preferred_cities = ARRAY['תל אביב יפו']
WHERE id = 'b8cd4afe-9625-4b05-83d4-d83756a67c15';

-- Fix Yaniv: telaviv -> תל אביב יפו (city)
UPDATE contact_leads
SET preferred_cities = ARRAY['תל אביב יפו']
WHERE id = 'b1cead69-162f-4105-ae29-920d1e6f7fed';

-- Fix רוני אלפנט: remove duplicate צפון_ישן
UPDATE contact_leads
SET preferred_neighborhoods = ARRAY['נמל_תל_אביב', 'צפון_חדש', 'צפון_ישן']
WHERE id = '6b95f5af-fa94-47a2-87f7-e0c17934b91b';

-- Fix יקי: יד אליהו -> דרום_תל_אביב (assuming based on aliases)
UPDATE contact_leads
SET preferred_neighborhoods = ARRAY['דרום_תל_אביב']
WHERE name = 'יקי' AND preferred_neighborhoods && ARRAY['יד אליהו']::text[];

-- General fix: normalize all neighborhood values that are labels instead of values
-- This catches any remaining mismatches
UPDATE contact_leads
SET preferred_neighborhoods = ARRAY['צפון_ישן']
WHERE preferred_neighborhoods && ARRAY['צפון הישן', 'הצפון הישן', 'OldNorth', 'old north', 'צפון ישן']::text[]
  AND NOT preferred_neighborhoods && ARRAY['צפון_ישן']::text[];

UPDATE contact_leads
SET preferred_neighborhoods = ARRAY['צפון_חדש']
WHERE preferred_neighborhoods && ARRAY['צפון החדש', 'הצפון החדש', 'NewNorth', 'new north', 'צפון חדש']::text[]
  AND NOT preferred_neighborhoods && ARRAY['צפון_חדש']::text[];

UPDATE contact_leads
SET preferred_neighborhoods = ARRAY['מרכז_העיר']
WHERE preferred_neighborhoods && ARRAY['מרכז', 'לב העיר', 'מרכז העיר', 'center']::text[]
  AND NOT preferred_neighborhoods && ARRAY['מרכז_העיר']::text[];