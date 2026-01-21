-- Batch 6: Update additional properties from manual scraping

-- 1: 973373e5 - תוצרת הארץ 5 (madlan MVpf8VPMiuC) - מודעה הוסרה
UPDATE scouted_properties 
SET is_active = false,
    features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date_source": "manual_scrape", "scrape_error": "מודעה הוסרה"}'::jsonb
WHERE id = '973373e5-17ed-4693-a4f7-9aee0852e16c';

-- 2: 87857324 - אפטר 15 (madlan zscjHc6Izfv) - גמיש
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "גמיש"}'::jsonb
WHERE id = '87857324-65af-45b0-b16f-d41fc774fcfd';

-- 3: 27bb7648 - לוי אשכול 78 (madlan XoPWldFTWbs) - 01/2026
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": "2026-01-01", "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "01/2026"}'::jsonb
WHERE id = '27bb7648-b15c-46a4-bf0a-a5b3ec069738';

-- Mark failed scrapes
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date_source": "manual_scrape", "scrape_error": "scrape_failed"}'::jsonb
WHERE id IN ('b61fecf3-7919-49f3-bde6-25fc87c12487', 'faf00967-fced-4d40-b3ed-c2ef9ba4f4d1');