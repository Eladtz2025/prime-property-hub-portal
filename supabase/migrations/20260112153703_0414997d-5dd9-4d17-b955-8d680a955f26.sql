-- Update cron jobs to run 3 times a day instead of 5

-- Remove existing jobs first (if they exist)
SELECT cron.unschedule('scout-properties-job');
SELECT cron.unschedule('match-leads-job');

-- Schedule scout-properties job - runs 3 times a day: 8:00, 16:00, 22:00
SELECT cron.schedule(
  'scout-properties-job',
  '0 8,16,22 * * *',
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

-- Schedule match-leads-job - runs 15 minutes after scout: 8:15, 16:15, 22:15
SELECT cron.schedule(
  'match-leads-job',
  '15 8,16,22 * * *',
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