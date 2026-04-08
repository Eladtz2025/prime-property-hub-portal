CREATE OR REPLACE FUNCTION public.get_customer_matches(customer_uuid uuid, include_dismissed boolean DEFAULT false)
 RETURNS TABLE(id uuid, title text, city text, neighborhood text, address text, price integer, rooms numeric, size integer, source text, source_url text, is_private boolean, property_type text, match_score integer, match_reasons text[], duplicate_group_id uuid, is_dismissed boolean, duplicates_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND sp.price IS NOT NULL
    AND sp.price > 0
    AND (sp.duplicate_group_id IS NULL OR sp.is_primary_listing = true)
    AND (
      include_dismissed = true 
      OR NOT EXISTS (
        SELECT 1 FROM dismissed_matches dm 
        WHERE dm.lead_id = customer_uuid 
          AND dm.scouted_property_id = sp.id
      )
    )
  ORDER BY match_score DESC NULLS LAST,
           (ml->>'priority')::INTEGER DESC NULLS LAST,
           sp.created_at DESC;
END;
$function$;