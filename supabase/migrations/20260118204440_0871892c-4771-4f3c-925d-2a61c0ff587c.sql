-- Update the cron job to use the new orchestrator function
-- First unschedule the existing job
SELECT cron.unschedule(7);

-- Schedule the new orchestrator job (05:00 Israel time = 03:00 UTC in summer, 02:00 in winter)
SELECT cron.schedule(
  'trigger-availability-check-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/trigger-availability-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM'
    ),
    body := '{}'::jsonb
  );
  $$
);