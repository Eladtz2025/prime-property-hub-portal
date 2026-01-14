-- Add yard_required field for customers who need a yard
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS yard_required boolean DEFAULT false;

-- Add flexibility fields for each feature
-- When flexible = true, the feature is preferred but not mandatory
-- When flexible = false, the feature is MUST (disqualifies if missing)
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS elevator_flexible boolean DEFAULT true;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS parking_flexible boolean DEFAULT true;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS balcony_flexible boolean DEFAULT true;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS yard_flexible boolean DEFAULT true;

-- Add comments for clarity
COMMENT ON COLUMN public.contact_leads.yard_required IS 'Whether the customer requires a yard/garden';
COMMENT ON COLUMN public.contact_leads.elevator_flexible IS 'If false and elevator_required=true, property MUST have elevator';
COMMENT ON COLUMN public.contact_leads.parking_flexible IS 'If false and parking_required=true, property MUST have parking';
COMMENT ON COLUMN public.contact_leads.balcony_flexible IS 'If false and balcony_required=true, property MUST have balcony';
COMMENT ON COLUMN public.contact_leads.yard_flexible IS 'If false and yard_required=true, property MUST have yard';