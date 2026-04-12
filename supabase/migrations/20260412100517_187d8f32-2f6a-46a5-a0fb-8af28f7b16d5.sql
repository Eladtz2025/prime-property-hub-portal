
SELECT cron.schedule(
  'auto-publish-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://jswumsdymlooeobrxict.supabase.co/functions/v1/auto-publish',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);
