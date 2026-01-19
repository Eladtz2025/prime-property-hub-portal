-- תיקון 1: ריצות matching - new_properties תמיד צריך להיות 0 (לא יוצרות נכסים חדשים)
UPDATE scout_runs 
SET new_properties = 0
WHERE source = 'matching' AND (new_properties IS NULL OR new_properties != 0);

-- תיקון 2: ריצות סריקה עם new_properties > properties_found (לא הגיוני)
-- סימון כ-NULL (לא ידוע) במקום ערך שגוי
UPDATE scout_runs 
SET new_properties = NULL
WHERE source IN ('yad2', 'madlan', 'homeless')
  AND new_properties IS NOT NULL
  AND properties_found IS NOT NULL
  AND new_properties > properties_found;

-- תיקון 3: ריצות ישנות (לפני היום) עם new_properties > 50 לריצה בודדת
-- סימון כ-NULL כי הערכים לא אמינים
UPDATE scout_runs 
SET new_properties = NULL
WHERE source IN ('yad2', 'madlan', 'homeless')
  AND new_properties > 50
  AND started_at < '2026-01-19T10:00:00Z';