-- Add retry tracking columns to scout_runs
ALTER TABLE scout_runs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE scout_runs ADD COLUMN IF NOT EXISTS retry_of UUID REFERENCES scout_runs(id);
ALTER TABLE scout_runs ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 2;

-- Create index for faster retry queries
CREATE INDEX IF NOT EXISTS idx_scout_runs_retry_lookup 
ON scout_runs (status, retry_count, started_at) 
WHERE retry_of IS NULL;