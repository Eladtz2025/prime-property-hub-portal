-- Add backfill settings to scout_settings
INSERT INTO scout_settings (category, setting_key, setting_value, description)
VALUES 
  ('backfill', 'enabled', 'true', 'האם עדכון תאריכי כניסה אוטומטי פעיל'),
  ('backfill', 'schedule_times', '["03:00", "12:00"]', 'שעות ריצה (ישראל)'),
  ('backfill', 'batch_size', '30', 'כמות נכסים לעיבוד בכל אצווה'),
  ('backfill', 'timeout_minutes', '5', 'זמן מקסימלי לריצה בדקות')
ON CONFLICT (category, setting_key) DO NOTHING;

-- Create cron job for automatic backfill - runs at 01:00 and 10:00 UTC (03:00 and 12:00 Israel time)
SELECT cron.schedule(
  'backfill-entry-dates-job',
  '0 1,10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/backfill-entry-dates-fast',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM'
    ),
    body := '{"batch_size": 30}'::jsonb
  );
  $$
);