-- Add size min/max columns for property size preferences
ALTER TABLE contact_leads ADD COLUMN size_min integer;
ALTER TABLE contact_leads ADD COLUMN size_max integer;