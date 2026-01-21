-- Add eligibility_reason column
ALTER TABLE contact_leads 
ADD COLUMN IF NOT EXISTS eligibility_reason TEXT;

COMMENT ON COLUMN contact_leads.matching_status IS 'eligible/incomplete - set automatically by trigger';
COMMENT ON COLUMN contact_leads.eligibility_reason IS 'Reason for ineligibility: missing cities, neighborhoods, budget, or rooms';

-- Create function to update lead eligibility automatically
CREATE OR REPLACE FUNCTION update_lead_eligibility()
RETURNS TRIGGER AS $$
BEGIN
  -- Check eligibility in order of importance
  IF NEW.preferred_cities IS NULL OR array_length(NEW.preferred_cities, 1) IS NULL THEN
    NEW.matching_status := 'incomplete';
    NEW.eligibility_reason := 'חסר ערים מועדפות';
  ELSIF NEW.preferred_neighborhoods IS NULL OR array_length(NEW.preferred_neighborhoods, 1) IS NULL THEN
    NEW.matching_status := 'incomplete';
    NEW.eligibility_reason := 'חסר שכונות מועדפות';
  ELSIF NEW.budget_max IS NULL THEN
    NEW.matching_status := 'incomplete';
    NEW.eligibility_reason := 'חסר תקציב';
  ELSIF NEW.rooms_min IS NULL AND NEW.rooms_max IS NULL THEN
    NEW.matching_status := 'incomplete';
    NEW.eligibility_reason := 'חסר טווח חדרים';
  ELSE
    NEW.matching_status := 'eligible';
    NEW.eligibility_reason := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run on insert or update
DROP TRIGGER IF EXISTS trigger_update_lead_eligibility ON contact_leads;
CREATE TRIGGER trigger_update_lead_eligibility
  BEFORE INSERT OR UPDATE ON contact_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_eligibility();

-- Update all existing leads with correct eligibility status
UPDATE contact_leads SET
  matching_status = CASE
    WHEN preferred_cities IS NULL OR array_length(preferred_cities, 1) IS NULL THEN 'incomplete'
    WHEN preferred_neighborhoods IS NULL OR array_length(preferred_neighborhoods, 1) IS NULL THEN 'incomplete'
    WHEN budget_max IS NULL THEN 'incomplete'
    WHEN rooms_min IS NULL AND rooms_max IS NULL THEN 'incomplete'
    ELSE 'eligible'
  END,
  eligibility_reason = CASE
    WHEN preferred_cities IS NULL OR array_length(preferred_cities, 1) IS NULL THEN 'חסר ערים מועדפות'
    WHEN preferred_neighborhoods IS NULL OR array_length(preferred_neighborhoods, 1) IS NULL THEN 'חסר שכונות מועדפות'
    WHEN budget_max IS NULL THEN 'חסר תקציב'
    WHEN rooms_min IS NULL AND rooms_max IS NULL THEN 'חסר טווח חדרים'
    ELSE NULL
  END;