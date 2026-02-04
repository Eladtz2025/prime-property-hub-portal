-- Create atomic increment function for scout run stats
-- Prevents race conditions when multiple pages update totals in parallel

CREATE OR REPLACE FUNCTION public.increment_scout_run_stats(
  p_run_id UUID,
  p_found INTEGER,
  p_new INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE scout_runs
  SET 
    properties_found = COALESCE(properties_found, 0) + p_found,
    new_properties = COALESCE(new_properties, 0) + p_new
  WHERE id = p_run_id;
END;
$$;

-- Grant execute to service_role (edge functions use this role)
GRANT EXECUTE ON FUNCTION public.increment_scout_run_stats(UUID, INTEGER, INTEGER) TO service_role;

-- Comment for documentation
COMMENT ON FUNCTION public.increment_scout_run_stats IS 
  'Atomically increment properties_found and new_properties counters for a scout run. Used by edge functions to prevent race conditions when parallel page scrapes complete.';