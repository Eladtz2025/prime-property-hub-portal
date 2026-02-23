UPDATE scout_runs
SET status = 'partial', completed_at = now()
WHERE id = '6bf8e3ab-29cf-43af-994a-badcabbf1d05'
AND status = 'running';