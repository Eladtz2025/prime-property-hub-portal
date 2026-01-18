DROP FUNCTION IF EXISTS public.get_customer_matches(uuid);

CREATE OR REPLACE FUNCTION public.get_customer_matches(customer_uuid uuid)
 RETURNS TABLE(id uuid, title text, city text, price integer, rooms numeric, size integer, source text, source_url text, is_private boolean, match_score integer, match_reasons text[], duplicate_group_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
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
    ARRAY(SELECT jsonb_array_elements_text(match_data->'reasons')) as match_reasons,
    sp.duplicate_group_id
  FROM scouted_properties sp,
    jsonb_array_elements(sp.matched_leads) AS match_data
  WHERE match_data->>'lead_id' = customer_uuid::TEXT
    AND sp.is_active = true
  ORDER BY (match_data->>'score')::INTEGER DESC;
END;
$function$;