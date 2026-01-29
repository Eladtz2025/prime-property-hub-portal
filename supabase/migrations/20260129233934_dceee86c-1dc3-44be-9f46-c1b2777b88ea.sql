
-- Fix the ambiguous column reference in get_customer_matches
-- Use explicit aliases for CTE columns

CREATE OR REPLACE FUNCTION public.get_customer_matches(customer_uuid uuid)
 RETURNS TABLE(id uuid, title text, city text, price integer, rooms numeric, size integer, source text, source_url text, is_private boolean, match_score integer, match_priority integer, match_reasons text[], duplicate_group_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  WITH matched_properties AS (
    SELECT 
      sp.id as prop_id,
      sp.title as prop_title,
      sp.city as prop_city,
      sp.price as prop_price,
      sp.rooms as prop_rooms,
      sp.size as prop_size,
      sp.source as prop_source,
      sp.source_url as prop_source_url,
      sp.is_private as prop_is_private,
      (match_data->>'score')::INTEGER as prop_match_score,
      COALESCE((match_data->>'priority')::INTEGER, 50) as prop_match_priority,
      ARRAY(SELECT jsonb_array_elements_text(match_data->'reasons')) as prop_match_reasons,
      sp.duplicate_group_id as prop_duplicate_group_id,
      sp.is_primary_listing,
      sp.created_at,
      -- For grouping: use duplicate_group_id if exists, else use property id
      COALESCE(sp.duplicate_group_id::text, sp.id::text) as group_key
    FROM scouted_properties sp,
      jsonb_array_elements(sp.matched_leads) AS match_data
    WHERE match_data->>'lead_id' = customer_uuid::TEXT
      AND sp.is_active = true
  ),
  -- Pick best property from each group (prefer primary listing, then highest score)
  best_per_group AS (
    SELECT DISTINCT ON (group_key)
      prop_id,
      prop_title,
      prop_city,
      prop_price,
      prop_rooms,
      prop_size,
      prop_source,
      prop_source_url,
      prop_is_private,
      prop_match_score,
      prop_match_priority,
      prop_match_reasons,
      prop_duplicate_group_id
    FROM matched_properties
    ORDER BY group_key, is_primary_listing DESC NULLS LAST, prop_match_score DESC, created_at ASC
  )
  SELECT 
    prop_id,
    prop_title,
    prop_city,
    prop_price,
    prop_rooms,
    prop_size,
    prop_source,
    prop_source_url,
    prop_is_private,
    prop_match_score,
    prop_match_priority,
    prop_match_reasons,
    prop_duplicate_group_id
  FROM best_per_group
  ORDER BY prop_match_priority DESC, prop_match_score DESC;
END;
$function$;
