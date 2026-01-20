-- Add new fields for furnished and mamad requirements
ALTER TABLE contact_leads 
ADD COLUMN IF NOT EXISTS furnished_required text NULL,
ADD COLUMN IF NOT EXISTS furnished_flexible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mamad_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS mamad_flexible boolean DEFAULT true;

-- Add comment for furnished_required values
COMMENT ON COLUMN contact_leads.furnished_required IS 'Values: fully_furnished, partially_furnished, or null';