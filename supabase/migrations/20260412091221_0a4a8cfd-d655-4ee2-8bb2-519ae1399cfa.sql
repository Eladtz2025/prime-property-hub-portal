
-- Update properties without price from 'new' to 'checked'
UPDATE public.scouted_properties 
SET status = 'checked' 
WHERE status = 'new' AND is_active = true AND (price IS NULL OR price = 0);

-- Update non-primary duplicate listings from 'new' to 'checked'
UPDATE public.scouted_properties 
SET status = 'checked' 
WHERE status = 'new' AND is_active = true AND is_primary_listing = false;
