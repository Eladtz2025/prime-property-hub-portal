-- Reset outdoor features for Madlan properties
-- These were incorrectly extracted from "מפרט מלא" section which lists ALL options
-- The checkmarks (✓/✗) are visual and don't appear in markdown
UPDATE scouted_properties
SET 
  features = features - 'balcony' - 'yard' - 'roof',
  matched_leads = '[]'::jsonb,  -- Clear matches since features changed
  updated_at = now()
WHERE source = 'madlan'
  AND is_active = true
  AND (
    features->>'balcony' = 'true' OR 
    features->>'yard' = 'true' OR 
    features->>'roof' = 'true'
  );