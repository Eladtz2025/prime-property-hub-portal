
-- Fix get_customer_matches to return only one property per duplicate group
-- This eliminates duplicate listings appearing multiple times

CREATE OR REPLACE FUNCTION public.get_customer_matches(customer_uuid uuid)
 RETURNS TABLE(id uuid, title text, city text, price integer, rooms numeric, size integer, source text, source_url text, is_private boolean, match_score integer, match_priority integer, match_reasons text[], duplicate_group_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH matched_properties AS (
    SELECT 
      sp.id,
      sp.title,
      sp.city,
      sp.price,
      sp.rooms,
      sp.size,
      sp.source,
      sp.source_url,
      sp.is_private,
      (match_data->>'score')::INTEGER as match_score,
      COALESCE((match_data->>'priority')::INTEGER, 50) as match_priority,
      ARRAY(SELECT jsonb_array_elements_text(match_data->'reasons')) as match_reasons,
      sp.duplicate_group_id,
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
      id,
      title,
      city,
      price,
      rooms,
      size,
      source,
      source_url,
      is_private,
      match_score,
      match_priority,
      match_reasons,
      duplicate_group_id
    FROM matched_properties
    ORDER BY group_key, is_primary_listing DESC NULLS LAST, match_score DESC, created_at ASC
  )
  SELECT * FROM best_per_group
  ORDER BY match_priority DESC, match_score DESC;
END;
$function$;

-- Also deactivate the 2 broken Madlan URLs
UPDATE scouted_properties 
SET is_active = false, 
    status = 'inactive'
WHERE source_url IN (
  'https://www.madlan.co.il/listings/9c2763f9fab3',
  'https://www.madlan.co.il/listings/a0e5e462a626'
);
