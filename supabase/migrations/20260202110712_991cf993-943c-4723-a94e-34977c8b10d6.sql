
-- Step 1: Clean stuck backfill tasks
UPDATE backfill_progress 
SET status = 'stopped', 
    completed_at = NOW(),
    error_message = 'Manually stopped - restart with new settings'
WHERE status = 'running' 
  AND task_name LIKE 'data_completion%';

-- Step 2: Update timeout setting to 30 minutes (as JSONB)
UPDATE scout_settings 
SET setting_value = '30'::jsonb 
WHERE category = 'backfill' 
  AND setting_key = 'timeout_minutes';

-- Step 3: Create cron job for scheduled backfill (03:00 and 12:00 Israel time = 01:00 and 10:00 UTC)
SELECT cron.schedule(
  'backfill-data-completion-job',
  '0 1,10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/backfill-property-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM'
    ),
    body := '{"action": "start"}'::jsonb
  );
  $$
);
