SELECT cron.unschedule('match-leads-job');

SELECT cron.schedule(
  'daily-matching',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('supabase.supabase_url') || '/functions/v1/trigger-matching',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := '{"send_whatsapp": true}'::jsonb,
    timeout_milliseconds := 120000
  ) AS request_id;
  $$
);