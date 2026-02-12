-- First remove any duplicate task_name entries (keep the latest)
DELETE FROM backfill_progress a
USING backfill_progress b
WHERE a.task_name = b.task_name 
  AND a.id < b.id;

-- Add unique constraint on task_name
ALTER TABLE backfill_progress ADD CONSTRAINT backfill_progress_task_name_unique UNIQUE (task_name);