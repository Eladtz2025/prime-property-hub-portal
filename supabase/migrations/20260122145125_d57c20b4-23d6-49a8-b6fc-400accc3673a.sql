-- Add 'partial' to the allowed statuses in scout_runs
ALTER TABLE scout_runs DROP CONSTRAINT IF EXISTS scout_runs_status_check;

ALTER TABLE scout_runs ADD CONSTRAINT scout_runs_status_check 
CHECK (status = ANY (ARRAY['running', 'completed', 'failed', 'stopped', 'partial']));

-- Clean up the stuck Madlan run
UPDATE scout_runs 
SET status = 'partial', completed_at = NOW()
WHERE id = '6f682162-ca3c-4d31-b9bc-74ebbaca4f73' AND status = 'running';