-- Reset the template's current_index and last_published_at
UPDATE auto_publish_queues 
SET current_index = 0, last_published_at = NULL 
WHERE id = '8d1974d0-b044-41f3-8f63-278a65cfed6c';

-- Delete the 3 duplicate log entries from the triple-fire
DELETE FROM auto_publish_log 
WHERE queue_id = '8d1974d0-b044-41f3-8f63-278a65cfed6c'
AND published_at >= '2026-04-12 10:10:00+00';