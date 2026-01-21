-- Add timeout settings for the cleanup guardian
INSERT INTO scout_settings (category, setting_key, setting_value, description)
VALUES 
  ('scraping', 'page_timeout_minutes', '3', 'זמן מקסימלי לעמוד בודד לפני סימון כ-failed'),
  ('scraping', 'run_timeout_minutes', '15', 'זמן מקסימלי לריצה שלמה לפני סגירה כ-partial')
ON CONFLICT (category, setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description;