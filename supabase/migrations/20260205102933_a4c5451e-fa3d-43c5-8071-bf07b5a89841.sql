-- Drop existing function first (return type changed)
DROP FUNCTION IF EXISTS public.get_customer_matches(UUID, BOOLEAN);

-- Recreate with winners filter and duplicates_count
CREATE OR REPLACE FUNCTION public.get_customer_matches(
  customer_uuid UUID, 
  include_dismissed BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  city TEXT,
  neighborhood TEXT,
  address TEXT,
  price INTEGER,
  rooms NUMERIC,
  size INTEGER,
  source TEXT,
  source_url TEXT,
  is_private BOOLEAN,
  property_type TEXT,
  match_score INTEGER,
  match_reasons TEXT[],
  duplicate_group_id UUID,
  is_dismissed BOOLEAN,
  duplicates_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.title,
    sp.city,
    sp.neighborhood,
    sp.address,
    sp.price,
    sp.rooms,
    sp.size,
    sp.source,
    sp.source_url,
    sp.is_private,
    sp.property_type,
    (ml->>'score')::INTEGER as match_score,
    ARRAY(SELECT jsonb_array_elements_text(ml->'reasons')) as match_reasons,
    sp.duplicate_group_id,
    EXISTS (
      SELECT 1 FROM dismissed_matches dm 
        WHERE dm.lead_id = customer_uuid 
        AND dm.scouted_property_id = sp.id
    ) as is_dismissed,
    -- Count all active properties in this duplicate group (including this one)
    COALESCE(
      (SELECT COUNT(*)::INTEGER 
       FROM scouted_properties dup 
       WHERE dup.duplicate_group_id = sp.duplicate_group_id 
         AND dup.is_active = true),
      1
    ) as duplicates_count
  FROM scouted_properties sp,
       LATERAL (
         SELECT ml_item as ml
         FROM jsonb_array_elements(sp.matched_leads) ml_item
         WHERE (ml_item->>'lead_id')::UUID = customer_uuid
         LIMIT 1
       ) matched
  WHERE sp.is_active = true
    -- Only show winners or non-duplicates
    AND (sp.duplicate_group_id IS NULL OR sp.is_primary_listing = true)
    AND (
      include_dismissed = true 
      OR NOT EXISTS (
        SELECT 1 FROM dismissed_matches dm 
        WHERE dm.lead_id = customer_uuid 
          AND dm.scouted_property_id = sp.id
      )
    )
  ORDER BY match_score DESC NULLS LAST, sp.created_at DESC;
END;
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION public.get_customer_matches(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_matches(UUID, BOOLEAN) TO service_role;