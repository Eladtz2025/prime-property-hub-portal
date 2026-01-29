-- Stop any running homeless scans
UPDATE scout_runs SET status = 'completed', completed_at = NOW() WHERE source = 'homeless' AND status = 'running';

-- Delete ALL homeless properties for clean re-scrape (they have corrupted data)
-- We'll re-populate with correct prices
DELETE FROM scouted_properties WHERE source = 'homeless';