-- Use cron.alter_job to update the command for availability check
SELECT cron.alter_job(
  job_id := 24,
  command := E'SELECT net.http_post(\n    url := ''https://jswumsdymlooeobrxict.supabase.co/functions/v1/trigger-availability-check-jina'',\n    headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM"}''::jsonb,\n    body := ''{}''::jsonb\n  ) AS request_id;'
);

-- Use cron.alter_job to update the command for backfill
SELECT cron.alter_job(
  job_id := 26,
  command := E'SELECT net.http_post(\n    url := ''https://jswumsdymlooeobrxict.supabase.co/functions/v1/backfill-property-data-jina'',\n    headers := jsonb_build_object(\n      ''Content-Type'', ''application/json'',\n      ''Authorization'', ''Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM''\n    ),\n    body := ''{"action": "start"}''::jsonb\n  );'
);