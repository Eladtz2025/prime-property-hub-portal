
CREATE OR REPLACE FUNCTION public.append_run_detail(p_run_id uuid, p_detail jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  updated_details jsonb;
BEGIN
  UPDATE availability_check_runs 
  SET run_details = COALESCE(run_details, '[]'::jsonb) || jsonb_build_array(p_detail)
  WHERE id = p_run_id
  RETURNING run_details INTO updated_details;

  UPDATE availability_check_runs
  SET 
    properties_checked = (
      SELECT count(DISTINCT d->>'property_id') 
      FROM jsonb_array_elements(updated_details) d
    ),
    inactive_marked = (
      SELECT count(*) 
      FROM jsonb_array_elements(updated_details) d 
      WHERE (d->>'is_inactive')::boolean = true
    )
  WHERE id = p_run_id;
END;
$function$;
