-- Batch 5: Update 18 properties with entry dates from manual scraping

-- 1: 6f510726 - יד אליהו (homeless) - מיידי (לפי 83130)
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = '6f510726-6642-4263-9b21-60f6f7594cc0';

-- 2: 6d5f6c43 - אבן סינא 68 (homeless) - 1/1/2026
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": "2026-01-01", "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "1/1/2026"}'::jsonb
WHERE id = '6d5f6c43-5de6-43dd-ba12-703f05073362';

-- 3: 6c6cc97a - הירקון כרם התימנים (homeless) - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = '6c6cc97a-5a81-4bb3-9fdf-afb185d057af';

-- 4: 5f0e2da1 - הצפון הישן דופלקס (homeless 83132) - 1/1/2025 
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": "2025-01-01", "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "1/1/2025"}'::jsonb
WHERE id = '5f0e2da1-404a-4a55-8cab-36fd3548c712';

-- 5: d28fc58b - הגוש הגדול דופלקס (homeless 83131) - 1/1/2025
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": "2025-01-01", "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "1/1/2025"}'::jsonb
WHERE id = 'd28fc58b-0871-4037-a8a8-908551013529';

-- 6: 694c3b77 - אשתורי הפרחי (homeless 83271) - 21/3/2026
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": "2026-03-21", "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "21/3/2026"}'::jsonb
WHERE id = '694c3b77-1b91-4fd4-98b9-43160ec75068';

-- 7: a2db2c59 - סטודיו הירקון (homeless iski) - לא צוין (עסקי)
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": null, "entry_date_source": "manual_scrape", "entry_date_raw": "לא צוין"}'::jsonb
WHERE id = 'a2db2c59-aa60-4283-9f6e-490e52baadd0';

-- 8: 6f0228fa - אדם הכהן (homeless 83270) - 1/1/2026
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": "2026-01-01", "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "1/1/2026"}'::jsonb
WHERE id = '6f0228fa-c458-40d0-88b8-045b13276123';

-- 9: f6f06cbe - אוסישקין (homeless 83208) - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = 'f6f06cbe-0471-458d-a3c2-6b05f9f06b87';

-- 10: d8e53e0f - שפינוזה (homeless 83256) - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = 'd8e53e0f-8ec4-4cfb-ba6a-97ae3f6a3f83';

-- 11: ace36d8f - לילנבלום (homeless 83265) - 1/1/2026
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": "2026-01-01", "immediate_entry": false, "entry_date_source": "manual_scrape", "entry_date_raw": "1/1/2026"}'::jsonb
WHERE id = 'ace36d8f-a373-4819-81d6-92d56d225bc2';

-- 12: 68d1f989 - פארק צמרת (homeless 83107) - מודעה נסגרה
UPDATE scouted_properties 
SET is_active = false,
    features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date_source": "manual_scrape", "scrape_error": "עסקה נסגרה"}'::jsonb
WHERE id = '68d1f989-c9d4-4dda-9f5c-f6b6e2bf37eb';

-- 13: 3d755fa9 - מאפו (homeless 83145) - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = '3d755fa9-92c3-4668-a68e-be98394c59cb';

-- 14: 23f5402a - מלכי ישראל (homeless 83237) - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = '23f5402a-3a77-4ae3-a86d-234a59706fc6';

-- 15: 62fa9055 - ארלוזורוב (homeless 83240) - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = '62fa9055-bd4c-4837-bffc-9a2a232b5bf7';

-- 16: 67217027 - כוכב הצפון (homeless 83238) - מודעה נסגרה
UPDATE scouted_properties 
SET is_active = false,
    features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date_source": "manual_scrape", "scrape_error": "עסקה נסגרה"}'::jsonb
WHERE id = '67217027-aca8-4c7b-9aae-526bf68b2752';

-- 17: 5f8a36fe - וינגייט 1 מדלן - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = '5f8a36fe-f816-4f27-99df-f8cfaf1233ab';

-- 18: 71b2b232 - גאולה 23 מדלן - מיידי
UPDATE scouted_properties 
SET features = COALESCE(features, '{}'::jsonb) || 
  '{"entry_date": null, "immediate_entry": true, "entry_date_source": "manual_scrape", "entry_date_raw": "מיידי"}'::jsonb
WHERE id = '71b2b232-50bc-4a3e-8732-2ecb87b5ee37';