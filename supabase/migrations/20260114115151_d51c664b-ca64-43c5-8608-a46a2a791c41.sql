-- Add roof feature columns
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS roof_required boolean;
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS roof_flexible boolean;

-- Add outdoor space OR mode flag
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS outdoor_space_any boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN contact_leads.outdoor_space_any IS 'When true, outdoor features (balcony/yard/roof) use OR logic instead of AND';