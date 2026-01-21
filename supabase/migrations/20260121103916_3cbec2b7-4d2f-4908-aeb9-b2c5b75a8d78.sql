-- Batch 3: Update entry dates for 12 more properties

-- Property 1: 5f0955f8 - דובנוב 11 - לא נמצא תאריך מפורש
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "לא צוין"}'::jsonb
WHERE id = '5f0955f8-d068-42c2-a19c-469ffb5b752a';

-- Property 2: 0fa98093 - נתן 84 - מיידית
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידית"}'::jsonb
WHERE id = '0fa98093-95df-4847-beeb-e13c61f93edc';

-- Property 3: 7f652297 - ויזל 21 - מודעה הוסרה
UPDATE scouted_properties 
SET is_active = false,
    features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date_source": "manual_scrape", "scrape_error": "מודעה הוסרה"}'::jsonb
WHERE id = '7f652297-4e37-437e-b838-061965ff378d';

-- Property 4: c6888798 - רוטשילד 129 - לא צוין
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "לא צוין"}'::jsonb
WHERE id = 'c6888798-e7f2-4136-8e99-3be2fcd0852d';

-- Property 5: 11ecb16a - הדף היומי 13 - לא צוין
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "לא צוין"}'::jsonb
WHERE id = '11ecb16a-5197-41c9-acbf-1e624a773eff';

-- Property 6: 38b91c1a - אליהו מפרארה 16 - לא צוין
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "לא צוין"}'::jsonb
WHERE id = '38b91c1a-9fa8-49d5-adbb-83382045c082';

-- Property 7: 62b19ab5 - בן יהודה 60 - כניסה מידית
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "כניסה מידית"}'::jsonb
WHERE id = '62b19ab5-e7ab-4795-9524-ca1211c604cf';

-- Property 8: 1976d0f9 - תל אביב יפו - כניסה גמישה
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "כניסה גמישה"}'::jsonb
WHERE id = '1976d0f9-fb3b-4d47-afd8-1151beda8ecf';

-- Property 9: 8893d344 - גרציאני יצחק - כניסה גמישה
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "כניסה גמישה"}'::jsonb
WHERE id = '8893d344-b9ce-4dc4-af60-60320c1c8081';

-- Property 10: fecff595 - לב תל אביב - כניסה מידית
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "כניסה מידית"}'::jsonb
WHERE id = 'fecff595-cdfa-4486-8f08-7b57f8ce92ee';

-- Property 11: 8435043e - נווה אביבים - כניסה גמישה
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "כניסה גמישה"}'::jsonb
WHERE id = '8435043e-6fd0-43ff-8fee-c3d9bd48c291';

-- Property 12: e3862e24 - מעבר לכיכר פרויקט - לא רלוונטי (פרויקט חדש)
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "פרויקט חדש"}'::jsonb
WHERE id = 'e3862e24-b6f2-44a4-b202-93a546fdd221';

-- Skip search result page URLs (not valid property URLs)
-- 029940c6 - madlan search page - skip
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date_source": "manual_scrape", "scrape_error": "URL לא תקין - דף חיפוש"}'::jsonb
WHERE id = '029940c6-cc77-45e3-8ac5-0907a277d38c';

-- c5334722 - madlan search page - skip
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date_source": "manual_scrape", "scrape_error": "URL לא תקין - דף חיפוש"}'::jsonb
WHERE id = 'c5334722-45ec-4027-8631-2aa351256977';

-- a0c16764 - madlan search page - skip
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date_source": "manual_scrape", "scrape_error": "URL לא תקין - דף חיפוש"}'::jsonb
WHERE id = 'a0c16764-b113-484f-b3f2-1586058e7463';