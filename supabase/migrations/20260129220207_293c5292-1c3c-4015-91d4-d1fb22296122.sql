-- Delete all corrupted Homeless records with impossible prices
-- These have room counts, years, or ad IDs concatenated into prices

DELETE FROM scouted_properties 
WHERE source = 'homeless' 
AND (
  -- Rentals with absurdly high prices (should be max ~30k)
  (property_type = 'rent' AND price > 30000)
  -- Or prices ending in suspicious patterns like 000001
  OR price::text ~ '000001$'
  OR price::text ~ '00001$'
  OR price::text ~ '0001$'
);

-- Also mark the stuck backfill task as failed so it doesn't block future runs
UPDATE backfill_progress 
SET status = 'failed', 
    error_message = 'Manually stopped - was stuck',
    completed_at = now()
WHERE status = 'running' 
AND task_name = 'data_completion'
AND started_at < now() - interval '30 minutes';