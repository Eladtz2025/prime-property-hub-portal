-- Add entry date matching settings to scout_settings
INSERT INTO scout_settings (category, setting_key, setting_value, description)
VALUES 
  ('matching', 'entry_date_range_strict', '10', 'טווח ימים (±) לתאריך ספציפי'),
  ('matching', 'entry_date_range_flexible', '14', 'טווח ימים (±) לתאריך גמיש'),
  ('matching', 'immediate_max_days', '30', 'ימים מקסימליים מהיום להגדרת כניסה מיידית')
ON CONFLICT (category, setting_key) DO NOTHING;