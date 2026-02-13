
-- Add schedule_end_time settings for long-running processes
INSERT INTO public.scout_settings (category, setting_key, setting_value, description)
VALUES
  ('backfill', 'schedule_end_time', '"02:30"', 'שעת סיום השלמת נתונים (שעון ישראל)'),
  ('duplicates', 'schedule_end_time', '"04:30"', 'שעת סיום ניקוי כפילויות (שעון ישראל)'),
  ('availability', 'schedule_end_time', '"06:30"', 'שעת סיום בדיקת זמינות (שעון ישראל)'),
  ('matching', 'schedule_end_time', '"08:30"', 'שעת סיום התאמות (שעון ישראל)')
ON CONFLICT (category, setting_key) DO NOTHING;
