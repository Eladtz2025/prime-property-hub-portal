
-- Stop the current backfill by marking it as completed
UPDATE backfill_progress 
SET status = 'completed', 
    completed_at = NOW(),
    error_message = 'Stopped - switching to manual scraping'
WHERE task_name = 'backfill_entry_dates' 
  AND status = 'running';
