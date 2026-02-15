
-- Use cron.alter_job() which respects pg_cron's internal permissions

-- Fix Backfill: 00:00 Israel = 22:00 UTC
SELECT cron.alter_job(26, schedule := '0 22 * * *');

-- Fix Matching: 07:00 Israel = 05:00 UTC  
SELECT cron.alter_job(23, schedule := '0 5 * * *');

-- Fix Duplicates: 03:00 Israel = 01:00 UTC + fix command to call detect-duplicates
SELECT cron.alter_job(
  25, 
  schedule := '0 1 * * *',
  command := '
  SELECT net.http_post(
    url := ''https://jswumsdymlooeobrxict.supabase.co/functions/v1/detect-duplicates'',
    headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM"}''::jsonb,
    body := ''{}''::jsonb
  ) AS request_id;
'
);
