
CREATE OR REPLACE FUNCTION public.append_run_detail(p_run_id uuid, p_detail jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE availability_check_runs 
  SET run_details = COALESCE(run_details, '[]'::jsonb) || jsonb_build_array(p_detail),
      properties_checked = jsonb_array_length(COALESCE(run_details, '[]'::jsonb) || jsonb_build_array(p_detail))
  WHERE id = p_run_id;
END;
$$;
