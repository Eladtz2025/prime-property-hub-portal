-- Create dismissed_matches table
CREATE TABLE public.dismissed_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.contact_leads(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  scouted_property_id UUID REFERENCES public.scouted_properties(id) ON DELETE CASCADE,
  dismissed_by UUID REFERENCES auth.users(id),
  dismissed_at TIMESTAMPTZ DEFAULT now(),
  reason TEXT,
  
  -- constraint: must have at least one property reference
  CONSTRAINT at_least_one_property CHECK (
    property_id IS NOT NULL OR scouted_property_id IS NOT NULL
  )
);

-- Create unique indexes (partial) to allow NULL values
CREATE UNIQUE INDEX dismissed_matches_lead_property_idx 
ON public.dismissed_matches(lead_id, property_id) 
WHERE property_id IS NOT NULL;

CREATE UNIQUE INDEX dismissed_matches_lead_scouted_idx 
ON public.dismissed_matches(lead_id, scouted_property_id) 
WHERE scouted_property_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.dismissed_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view dismissed matches"
ON public.dismissed_matches FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert dismissed matches"
ON public.dismissed_matches FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete dismissed matches"
ON public.dismissed_matches FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Update get_customer_matches function to exclude dismissed properties
CREATE OR REPLACE FUNCTION public.get_customer_matches(customer_uuid UUID, include_dismissed BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
  id UUID,
  source TEXT,
  source_url TEXT,
  city TEXT,
  neighborhood TEXT,
  address TEXT,
  price INTEGER,
  rooms NUMERIC,
  size INTEGER,
  floor INTEGER,
  is_private BOOLEAN,
  property_type TEXT,
  match_score INTEGER,
  match_reasons TEXT[],
  matched_at TIMESTAMPTZ,
  title TEXT,
  duplicate_group_id UUID,
  is_dismissed BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.source,
    sp.source_url,
    sp.city,
    sp.neighborhood,
    sp.address,
    sp.price,
    sp.rooms,
    sp.size,
    sp.floor,
    sp.is_private,
    sp.property_type,
    (sp.match_data->>'match_score')::INTEGER as match_score,
    ARRAY(SELECT jsonb_array_elements_text(sp.match_data->'match_reasons')) as match_reasons,
    (sp.match_data->>'matched_at')::TIMESTAMPTZ as matched_at,
    sp.title,
    sp.duplicate_group_id,
    EXISTS (
      SELECT 1 FROM dismissed_matches dm 
      WHERE dm.lead_id = customer_uuid AND dm.scouted_property_id = sp.id
    ) as is_dismissed
  FROM scouted_properties sp
  WHERE sp.match_data->>'lead_id' = customer_uuid::TEXT
    AND sp.is_active = true
    AND (
      include_dismissed = true 
      OR NOT EXISTS (
        SELECT 1 FROM dismissed_matches dm 
        WHERE dm.lead_id = customer_uuid AND dm.scouted_property_id = sp.id
      )
    )
  ORDER BY match_score DESC NULLS LAST, sp.created_at DESC;
END;
$$;