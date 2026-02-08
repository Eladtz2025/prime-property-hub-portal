-- ==============================================
-- STEP 1: Delete dead job (backfill-entry-dates-job)
-- ==============================================
SELECT cron.unschedule('backfill-entry-dates-job');

-- ==============================================
-- STEP 2: Reschedule all 5 jobs + backfill
-- ==============================================

-- 2a. scout-properties-job: */10 * * * * → */5 5-11 * * *
SELECT cron.unschedule('scout-properties-job');
SELECT cron.schedule(
  'scout-properties-job',
  '*/5 5-11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/trigger-scout-all',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 2b. cleanup-stuck-runs: */5 * * * * → 30 7,12 * * *
SELECT cron.unschedule('cleanup-stuck-runs');
SELECT cron.schedule(
  'cleanup-stuck-runs',
  '30 7,12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/cleanup-stuck-runs',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 2c. match-leads-job: */15 * * * * → 0 21 * * *
SELECT cron.unschedule('match-leads-job');
SELECT cron.schedule(
  'match-leads-job',
  '0 21 * * *',
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

-- 2d. availability-check-continuous: */10 * * * * → */10 3-4 * * *
SELECT cron.unschedule('availability-check-continuous');
SELECT cron.schedule(
  'availability-check-continuous',
  '*/10 3-4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/trigger-availability-check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 2e. cleanup-orphan-duplicates-hourly: 0 * * * * → 0 8 * * *
SELECT cron.unschedule('cleanup-orphan-duplicates-hourly');
SELECT cron.schedule(
  'cleanup-orphan-duplicates-hourly',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/cleanup-orphan-duplicates',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 2f. backfill-data-completion-job: 0 1,10 * * * → 0 1,12 * * *
SELECT cron.unschedule('backfill-data-completion-job');
SELECT cron.schedule(
  'backfill-data-completion-job',
  '0 1,12 * * *',
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