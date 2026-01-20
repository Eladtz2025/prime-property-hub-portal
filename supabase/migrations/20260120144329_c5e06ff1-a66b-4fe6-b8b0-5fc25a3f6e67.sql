-- Add immediate_entry column to contact_leads
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS immediate_entry BOOLEAN DEFAULT FALSE;