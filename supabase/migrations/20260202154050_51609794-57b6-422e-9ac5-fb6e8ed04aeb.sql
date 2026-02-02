-- Update batch_size to 20 (50 was causing timeouts)
UPDATE scout_settings SET setting_value = '20' WHERE category = 'availability' AND setting_key = 'batch_size';

-- Also fix the get_customer_matches function - remove reference to match_data column which doesn't exist
-- The old function signature needs to be kept for backwards compatibility
DROP FUNCTION IF EXISTS public.get_customer_matches(uuid);

-- Recreate the function with proper column references (matched_leads not match_data)
CREATE OR REPLACE FUNCTION public.get_customer_matches(customer_uuid uuid, include_dismissed boolean DEFAULT false)
RETURNS TABLE (
  id uuid,
  source text,
  source_url text,
  city text,
  neighborhood text,
  address text,
  price integer,
  rooms numeric,
  size integer,
  floor integer,
  is_private boolean,
  property_type text,
  match_score integer,
  match_reasons text[],
  matched_at timestamp with time zone,
  title text,
  duplicate_group_id uuid,
  is_dismissed boolean
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
    (match_data->>'score')::INTEGER as match_score,
    ARRAY(SELECT jsonb_array_elements_text(match_data->'reasons')) as match_reasons,
    (match_data->>'matched_at')::TIMESTAMPTZ as matched_at,
    sp.title,
    sp.duplicate_group_id,
    EXISTS (
      SELECT 1 FROM dismissed_matches dm 
      WHERE dm.lead_id = customer_uuid AND dm.scouted_property_id = sp.id
    ) as is_dismissed
  FROM scouted_properties sp,
    jsonb_array_elements(sp.matched_leads) AS match_data
  WHERE match_data->>'lead_id' = customer_uuid::TEXT
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