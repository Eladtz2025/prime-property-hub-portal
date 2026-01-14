-- Clean up stuck runs that have been running for more than 1 hour
UPDATE scout_runs 
SET status = 'failed', 
    error_message = 'Timeout - run did not complete',
    completed_at = NOW()
WHERE status = 'running' 
  AND started_at < NOW() - INTERVAL '1 hour';