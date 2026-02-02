-- Add 'stopped' to the status check constraint
ALTER TABLE backfill_progress DROP CONSTRAINT IF EXISTS backfill_progress_status_check;
ALTER TABLE backfill_progress ADD CONSTRAINT backfill_progress_status_check 
  CHECK (status IN ('pending', 'running', 'completed', 'failed', 'stopped'));

-- Now update stuck tasks
UPDATE backfill_progress 
SET status = 'stopped', 
    completed_at = NOW(),
    error_message = 'Manually stopped - query syntax fix'
WHERE status = 'running';