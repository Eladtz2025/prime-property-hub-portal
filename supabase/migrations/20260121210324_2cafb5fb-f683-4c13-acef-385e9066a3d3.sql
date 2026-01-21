-- Add matching schedule_times setting
INSERT INTO scout_settings (category, setting_key, setting_value, description)
VALUES ('matching', 'schedule_times', '["09:15", "18:15"]', 'שעות הרצת התאמות אוטומטיות (שעון ישראל)')
ON CONFLICT (category, setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Update cron to run every 15 minutes (function will check if it's scheduled time)
SELECT cron.unschedule('match-leads-job');

SELECT cron.schedule(
  'match-leads-job',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/trigger-matching',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM'
    ),
    body := '{"send_whatsapp": true}'::jsonb
  );
  $$
);