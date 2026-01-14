-- Clean up stuck running scans (running for more than 10 minutes)
UPDATE scout_runs 
SET status = 'failed',
    completed_at = NOW(),
    error_message = 'Timeout - scan exceeded 10 minute limit'
WHERE status = 'running'
AND started_at < NOW() - INTERVAL '10 minutes';