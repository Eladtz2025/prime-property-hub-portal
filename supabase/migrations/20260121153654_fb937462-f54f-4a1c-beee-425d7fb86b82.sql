-- Add eligibility settings to scout_settings
INSERT INTO scout_settings (category, setting_key, setting_value, description) VALUES
('eligibility', 'require_cities', 'true', 'האם לדרוש ערים מועדפות לכשירות'),
('eligibility', 'require_neighborhoods', 'true', 'האם לדרוש שכונות מועדפות לכשירות'),
('eligibility', 'require_budget', 'true', 'האם לדרוש תקציב לכשירות'),
('eligibility', 'require_rooms', 'true', 'האם לדרוש טווח חדרים לכשירות')
ON CONFLICT (category, setting_key) DO NOTHING;

-- Update trigger to be dynamic - read settings from scout_settings table
CREATE OR REPLACE FUNCTION public.update_lead_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  v_require_cities BOOLEAN;
  v_require_neighborhoods BOOLEAN;
  v_require_budget BOOLEAN;
  v_require_rooms BOOLEAN;
BEGIN
  -- Read settings from scout_settings table
  SELECT COALESCE((setting_value)::boolean, true) INTO v_require_cities
  FROM scout_settings WHERE category = 'eligibility' AND setting_key = 'require_cities';
  
  SELECT COALESCE((setting_value)::boolean, true) INTO v_require_neighborhoods
  FROM scout_settings WHERE category = 'eligibility' AND setting_key = 'require_neighborhoods';
  
  SELECT COALESCE((setting_value)::boolean, true) INTO v_require_budget
  FROM scout_settings WHERE category = 'eligibility' AND setting_key = 'require_budget';
  
  SELECT COALESCE((setting_value)::boolean, true) INTO v_require_rooms
  FROM scout_settings WHERE category = 'eligibility' AND setting_key = 'require_rooms';

  -- Default to true if settings not found
  v_require_cities := COALESCE(v_require_cities, true);
  v_require_neighborhoods := COALESCE(v_require_neighborhoods, true);
  v_require_budget := COALESCE(v_require_budget, true);
  v_require_rooms := COALESCE(v_require_rooms, true);

  -- Check eligibility based on dynamic settings
  IF v_require_cities AND (NEW.preferred_cities IS NULL OR array_length(NEW.preferred_cities, 1) IS NULL) THEN
    NEW.matching_status := 'incomplete';
    NEW.eligibility_reason := 'חסר ערים מועדפות';
  ELSIF v_require_neighborhoods AND (NEW.preferred_neighborhoods IS NULL OR array_length(NEW.preferred_neighborhoods, 1) IS NULL) THEN
    NEW.matching_status := 'incomplete';
    NEW.eligibility_reason := 'חסר שכונות מועדפות';
  ELSIF v_require_budget AND NEW.budget_max IS NULL THEN
    NEW.matching_status := 'incomplete';
    NEW.eligibility_reason := 'חסר תקציב';
  ELSIF v_require_rooms AND NEW.rooms_min IS NULL AND NEW.rooms_max IS NULL THEN
    NEW.matching_status := 'incomplete';
    NEW.eligibility_reason := 'חסר טווח חדרים';
  ELSE
    NEW.matching_status := 'eligible';
    NEW.eligibility_reason := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;