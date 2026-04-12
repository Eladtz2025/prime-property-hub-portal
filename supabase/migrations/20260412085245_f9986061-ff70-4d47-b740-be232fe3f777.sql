SELECT cron.unschedule('cleanup-orphan-duplicates-hourly');

SELECT cron.schedule(
  'daily-dedup-scan',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('supabase.supabase_url') || '/functions/v1/detect-duplicates',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) AS request_id;
  $$
);