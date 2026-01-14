
-- Clean up stuck running scans (one-time cleanup)
UPDATE scout_runs 
SET status = 'failed',
    completed_at = NOW(),
    error_message = 'Manually cleaned - stuck before incremental update fix'
WHERE status = 'running'
AND started_at < NOW() - INTERVAL '30 minutes';
