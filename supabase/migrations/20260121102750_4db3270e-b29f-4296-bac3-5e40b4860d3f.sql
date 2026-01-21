
-- Update entry dates for first batch of 10 properties
-- Property 1: a4190348 - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = 'a4190348-9075-4986-9709-8e5ac2c18225';

-- Property 2: 53311437 - 02/2026
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": "2026-02-01", "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "02/2026"}'::jsonb
WHERE id = '53311437-2d48-45d0-9a27-ca4d082b09cf';

-- Property 3: f0747c94 - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = 'f0747c94-f6be-4d76-8fb3-3b44ab9e6d4b';

-- Property 4: bb8d544f - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = 'bb8d544f-7556-4b31-9d50-447ef80d7924';

-- Property 5: b8808e91 - גמיש (flexible, not immediate)
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "גמיש"}'::jsonb
WHERE id = 'b8808e91-09e4-4afd-83f6-571d57b98526';

-- Property 6: fccd93da - 02/2026
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": "2026-02-01", "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "02/2026"}'::jsonb
WHERE id = 'fccd93da-0998-49f6-abeb-3db8520c11e8';

-- Property 7: 0333463f (yad2) - 28/09/25
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": "2025-09-28", "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "28/09/25"}'::jsonb
WHERE id = '0333463f-0370-40cd-beec-df39cdffa200';

-- Property 8: 0af7c034 (yad2) - כניסה גמישה
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "כניסה גמישה"}'::jsonb
WHERE id = '0af7c034-551f-4116-99a4-cab2c7d7ae06';

-- Property 9: 9ffe3cea (yad2) - 15/01/26
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": "2026-01-15", "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "15/01/26"}'::jsonb
WHERE id = '9ffe3cea-7250-42f0-b56e-f5950574c19a';

-- Property 10: 08e5f2a1 (yad2) - כניסה מידית
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "כניסה מידית"}'::jsonb
WHERE id = '08e5f2a1-b824-407f-8f7b-575941aeaaa5';
