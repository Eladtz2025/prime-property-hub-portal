-- Add move_out_date column for date range support
ALTER TABLE public.contact_leads 
ADD COLUMN IF NOT EXISTS move_out_date DATE;

-- Fix old neighborhood data - normalize values without underscores
UPDATE contact_leads 
SET preferred_neighborhoods = array_replace(preferred_neighborhoods, 'צפוןישן', 'צפון_ישן')
WHERE 'צפוןישן' = ANY(preferred_neighborhoods);

UPDATE contact_leads 
SET preferred_neighborhoods = array_replace(preferred_neighborhoods, 'צפוןחדש', 'צפון_חדש')
WHERE 'צפוןחדש' = ANY(preferred_neighborhoods);