-- Update cleanup-stuck-runs cron to run every 15 minutes during peak scouting hours (05:00-12:59 UTC)
SELECT cron.unschedule(22);

SELECT cron.schedule(
  'cleanup-stuck-runs',
  '*/15 5,6,7,8,9,10,11,12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/cleanup-stuck-runs',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);