UPDATE scout_runs
SET 
  status = 'failed',
  error_message = 'Manually stopped - legacy auto-trigger cleanup',
  completed_at = NOW()
WHERE source = 'matching'
  AND status = 'running'
  AND started_at < NOW() - INTERVAL '10 minutes';