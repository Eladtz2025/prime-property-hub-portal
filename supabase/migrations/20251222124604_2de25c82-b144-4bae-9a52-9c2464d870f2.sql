-- Add rental-specific fields
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS pets boolean DEFAULT false;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS tenant_type text;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS flexible_move_date boolean DEFAULT false;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS parking_required boolean DEFAULT false;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS balcony_required boolean DEFAULT false;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS elevator_required boolean DEFAULT false;

-- Add purchase-specific fields
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS purchase_purpose text;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS cash_available integer;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS property_to_sell boolean DEFAULT false;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS lawyer_details text;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS urgency_level text;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS renovation_budget integer;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS new_or_second_hand text;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS floor_preference text;
ALTER TABLE public.contact_leads ADD COLUMN IF NOT EXISTS view_preference text;

-- Add comments for documentation
COMMENT ON COLUMN public.contact_leads.pets IS 'Does the tenant have pets';
COMMENT ON COLUMN public.contact_leads.tenant_type IS 'Type: student, employee, family, couple';
COMMENT ON COLUMN public.contact_leads.flexible_move_date IS 'Is the move-in date flexible';
COMMENT ON COLUMN public.contact_leads.parking_required IS 'Requires parking';
COMMENT ON COLUMN public.contact_leads.balcony_required IS 'Requires balcony';
COMMENT ON COLUMN public.contact_leads.elevator_required IS 'Requires elevator';
COMMENT ON COLUMN public.contact_leads.purchase_purpose IS 'Purpose: residence, investment, for_child';
COMMENT ON COLUMN public.contact_leads.cash_available IS 'Available cash amount';
COMMENT ON COLUMN public.contact_leads.property_to_sell IS 'Has existing property to sell';
COMMENT ON COLUMN public.contact_leads.lawyer_details IS 'Lawyer contact details';
COMMENT ON COLUMN public.contact_leads.urgency_level IS 'Urgency: low, medium, high, immediate';
COMMENT ON COLUMN public.contact_leads.renovation_budget IS 'Budget for renovations';
COMMENT ON COLUMN public.contact_leads.new_or_second_hand IS 'Preference: new, second_hand, both';
COMMENT ON COLUMN public.contact_leads.floor_preference IS 'Floor: ground, low, mid, high, top, any';
COMMENT ON COLUMN public.contact_leads.view_preference IS 'View: sea, city, park, any';