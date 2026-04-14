
SELECT cron.alter_job(
  job_id := 32,
  command := $$
    SELECT net.http_post(
      url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/detect-duplicates',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM"}'::jsonb,
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    ) AS request_id;
  $$
);

SELECT cron.alter_job(
  job_id := 33,
  command := $$
    SELECT net.http_post(
      url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/trigger-matching',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM"}'::jsonb,
      body := '{"send_whatsapp": true}'::jsonb,
      timeout_milliseconds := 120000
    ) AS request_id;
  $$
);
