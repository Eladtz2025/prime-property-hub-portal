-- Batch 2: Update entry dates for 13 more properties

-- Property 1: 9570925e - מטלון 78 - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = '9570925e-1f1b-4b7d-8f2f-c2d5502ea5b6';

-- Property 2: b5fa9e1c - בית אל 47 - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = 'b5fa9e1c-c038-4522-8343-8e5958828321';

-- Property 3: 5921d320 - צה"ל 12 - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = '5921d320-afe9-47fa-9cdd-36c2907d85ad';

-- Property 4: 1de1e3de - טרומפלדור 30 - 12/2025
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": "2025-12-01", "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "12/2025"}'::jsonb
WHERE id = '1de1e3de-2b82-4fe7-a04f-0c386fe5a9fd';

-- Property 5: 995775f6 - גרינבוים 31 - 11/02/26
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": "2026-02-11", "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "11/02/26"}'::jsonb
WHERE id = '995775f6-e0f7-4cd6-a6fb-b33d3fe9e9cf';

-- Property 6: 55d0b5e2 - מעפילי אגוז 19 - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "כניסה מידית"}'::jsonb
WHERE id = '55d0b5e2-b408-43e1-9998-ae3f2f157d90';

-- Property 7: 32aeaecb - עולי הגרדום 10 - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "כניסה מידית"}'::jsonb
WHERE id = '32aeaecb-4ae9-488f-a364-3fb495fe2bf1';

-- Property 8: 027c290d - וינגייט 3 - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "כניסה מידית"}'::jsonb
WHERE id = '027c290d-2ab9-4654-8664-222e45cb94a8';

-- Property 9: 9070d207 - פרופסור ליבוביץ 22 - 01/02/26
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": "2026-02-01", "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "01/02/26"}'::jsonb
WHERE id = '9070d207-c1ea-4a83-bf40-45a83ce2d40e';

-- Property 10: 747f8a78 - בנימין זאב באכר 39 - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "כניסה מידית"}'::jsonb
WHERE id = '747f8a78-d8d3-420c-bcfe-9e5e039fd0f2';

-- Property 11: 4c70b6ea - קהילת ונציה 2 - גמיש
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "כניסה גמישה"}'::jsonb
WHERE id = '4c70b6ea-3570-451f-a890-590b2cb2c574';

-- Property 12: 69b4d6fc - דב כרמי - גמיש
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "כניסה גמישה"}'::jsonb
WHERE id = '69b4d6fc-9f1f-4a51-ba27-a9ec83efff99';

-- Property 13: ae59edfd - הירקון - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = 'ae59edfd-c48d-40e2-9196-7abdc99d5afa';

-- Property 14: a8ab6080 - אברבנאל 5 - מודעה הוסרה
UPDATE scouted_properties 
SET is_active = false,
    features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date_source": "manual_scrape", "scrape_error": "מודעה הוסרה"}'::jsonb
WHERE id = 'a8ab6080-c6d5-41b0-8fae-aef374c13924';