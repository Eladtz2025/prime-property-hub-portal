
-- 1. Backfill: remove 14:00 run, keep only 03:00 IL (01:00 UTC)
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'backfill-data-completion-job'),
  schedule := '0 1 * * *'
);

-- 2. Availability check: single trigger at 05:00 IL (03:00 UTC)
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'availability-check-continuous'),
  schedule := '0 3 * * *'
);

-- 3. Scout properties: align to 23:00-23:55 IL (21:00 UTC)
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'scout-properties-job'),
  schedule := '*/5 21 * * *'
);

-- 4. Cleanup stuck runs: unschedule (integrated into other functions)
SELECT cron.unschedule('cleanup-stuck-runs');

-- 5. Cleanup orphan duplicates: move to 00:00 IL (22:00 UTC)
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-orphan-duplicates-hourly'),
  schedule := '0 22 * * *'
);
