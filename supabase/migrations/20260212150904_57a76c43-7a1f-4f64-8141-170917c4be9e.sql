-- 1. Clear all matches
UPDATE scouted_properties SET matched_leads = '[]'::jsonb, status = 'new' WHERE matched_leads IS NOT NULL AND matched_leads != '[]'::jsonb;

-- 2. Fix Ofir's preferred_cities
UPDATE contact_leads SET preferred_cities = ARRAY['תל אביב יפו'] WHERE name ILIKE '%אופיר%' AND preferred_cities::text ILIKE '%old/newnorth%';