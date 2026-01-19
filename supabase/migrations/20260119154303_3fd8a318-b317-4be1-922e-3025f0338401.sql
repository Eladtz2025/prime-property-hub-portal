-- Add unique constraint on source + source_id to prevent race conditions
-- First, remove any actual duplicates if they exist
DELETE FROM scouted_properties a
USING scouted_properties b
WHERE a.id > b.id 
  AND a.source = b.source 
  AND a.source_id = b.source_id;

-- Add the unique constraint
ALTER TABLE scouted_properties 
ADD CONSTRAINT scouted_properties_source_source_id_unique UNIQUE (source, source_id);

-- Clean up historical scout_runs with inflated new_properties counts
-- (runs where new_properties > properties_found for non-matching runs)
UPDATE scout_runs 
SET new_properties = LEAST(new_properties, properties_found, 100)
WHERE source != 'matching'
  AND new_properties > 200;