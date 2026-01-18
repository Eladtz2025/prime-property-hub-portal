-- Clean up stuck scout runs that have been running for more than 10 minutes
UPDATE scout_runs 
SET status = 'failed', 
    error_message = 'Timeout - cancelled manually',
    completed_at = NOW()
WHERE status = 'running' 
  AND started_at < NOW() - INTERVAL '10 minutes';