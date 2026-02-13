
-- Fix Ofir's preferred cities
UPDATE contact_leads 
SET preferred_cities = ARRAY['תל אביב יפו']
WHERE id = 'e988ffb1-4a98-42c4-bb5f-a55ef090b3f8';

-- Clean matched_leads from inactive properties
UPDATE scouted_properties SET matched_leads = '[]'::jsonb
WHERE is_active = false AND matched_leads IS NOT NULL 
  AND jsonb_array_length(matched_leads) > 0;

-- Clean matched_leads from non-primary duplicates
UPDATE scouted_properties SET matched_leads = '[]'::jsonb
WHERE is_primary_listing = false AND duplicate_group_id IS NOT NULL 
  AND matched_leads IS NOT NULL AND jsonb_array_length(matched_leads) > 0;

-- Create trigger function for price change cleanup
CREATE OR REPLACE FUNCTION public.clean_matches_on_price_change()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF OLD.price IS NOT NULL AND NEW.price IS NOT NULL 
     AND OLD.price > 0 AND NEW.price > 0
     AND ABS(NEW.price - OLD.price)::float / OLD.price > 0.20 THEN
    NEW.matched_leads = '[]'::jsonb;
    NEW.status = 'new';
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER clean_matches_on_price_change
BEFORE UPDATE ON scouted_properties
FOR EACH ROW
WHEN (OLD.price IS DISTINCT FROM NEW.price)
EXECUTE FUNCTION public.clean_matches_on_price_change();
