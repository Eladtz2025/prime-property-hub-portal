-- Add roof and furnished amenity columns to properties table (Fix 3 of matching audit)
-- Applied to production 2026-06-03 via Supabase dashboard SQL editor; this file records it in repo history.
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS roof boolean DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS furnished boolean DEFAULT false;

-- Documentation
COMMENT ON COLUMN public.properties.roof IS 'Whether the property has a roof / rooftop area (amenity, agent-managed)';
COMMENT ON COLUMN public.properties.furnished IS 'Whether the property is furnished (amenity, agent-managed)';
