-- Drop the partial index that doesn't work with ON CONFLICT
DROP INDEX IF EXISTS scouted_properties_source_url_unique;

-- Create a proper unique constraint that supports ON CONFLICT
ALTER TABLE scouted_properties
ADD CONSTRAINT scouted_properties_source_source_url_unique
UNIQUE (source, source_url);