-- Marketing audit P2 (edge-sec / db-3): re-schedule the social-scheduler and
-- auto-publish pg_cron jobs to send the shared CRON_SECRET in an `x-cron-secret`
-- header, read from Vault (not hard-coded). The matching edge functions reject
-- any caller that does not present this secret (or an internal service-role call).
--
-- The Authorization bearer remains the public anon/publishable key purely so the
-- Supabase gateway routes the request; it is not what authorizes the action.
--
-- cron.schedule() upserts by job name, so this safely re-defines jobs 31 & 34.

select cron.schedule(
  'social-scheduler-every-5-min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/social-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := jsonb_build_object('time', now())
  ) as request_id;
  $$
);

select cron.schedule(
  'auto-publish-every-5-min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/auto-publish',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := jsonb_build_object('time', now())
  ) as request_id;
  $$
);
