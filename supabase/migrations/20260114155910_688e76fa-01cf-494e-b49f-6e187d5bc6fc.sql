-- Add pets_flexible column to contact_leads
ALTER TABLE contact_leads 
ADD COLUMN IF NOT EXISTS pets_flexible boolean DEFAULT true;