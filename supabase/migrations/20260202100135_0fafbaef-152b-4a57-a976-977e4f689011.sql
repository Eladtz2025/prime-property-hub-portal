-- Function to clean matched_leads when property becomes inactive or is deleted
CREATE OR REPLACE FUNCTION public.clean_matched_leads_on_inactive()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- If property is being deactivated, clear its matched_leads
    IF OLD.is_active = true AND NEW.is_active = false THEN
      NEW.matched_leads = '[]'::jsonb;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- For DELETE, just allow the deletion (matched_leads will be removed with the row)
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger on scouted_properties table
DROP TRIGGER IF EXISTS clean_matches_on_inactive ON public.scouted_properties;

CREATE TRIGGER clean_matches_on_inactive
BEFORE UPDATE OR DELETE ON public.scouted_properties
FOR EACH ROW
EXECUTE FUNCTION public.clean_matched_leads_on_inactive();