-- Add matching_status column to contact_leads
ALTER TABLE public.contact_leads 
ADD COLUMN IF NOT EXISTS matching_status TEXT DEFAULT 'pending';

-- Add comment explaining the values
COMMENT ON COLUMN public.contact_leads.matching_status IS 'Status of matching eligibility: pending, eligible, missing_neighborhoods, missing_city, no_matches';