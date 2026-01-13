-- מחיקת jobs קיימים
SELECT cron.unschedule('scout-properties-job');
SELECT cron.unschedule('match-leads-job');

-- יצירת scout-properties job עם זמנים מתוקנים לשעון ישראל
-- 08:00, 16:00, 22:00 בישראל = 06:00, 14:00, 20:00 UTC
SELECT cron.schedule(
  'scout-properties-job',
  '0 6,14,20 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/scout-properties',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM'
    ),
    body := '{"run_all": true}'::jsonb
  );
  $$
);

-- יצירת match-leads job - 15 דקות אחרי הסריקה
SELECT cron.schedule(
  'match-leads-job',
  '15 6,14,20 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/match-scouted-to-leads',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM'
    ),
    body := '{"send_whatsapp": true}'::jsonb
  );
  $$
);