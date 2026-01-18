-- Create atomic increment function for matching progress
CREATE OR REPLACE FUNCTION increment_matching_progress(
  p_run_id UUID,
  p_properties_count INT,
  p_matches_count INT
) RETURNS TABLE(
  properties_found INT,
  new_properties INT,
  leads_matched INT
) AS $$
  UPDATE scout_runs 
  SET 
    properties_found = COALESCE(scout_runs.properties_found, 0) + p_properties_count,
    leads_matched = COALESCE(scout_runs.leads_matched, 0) + p_matches_count
  WHERE id = p_run_id
  RETURNING scout_runs.properties_found, scout_runs.new_properties, scout_runs.leads_matched;
$$ LANGUAGE SQL;

-- Update current stuck run to completed
UPDATE scout_runs 
SET status = 'completed', 
    completed_at = NOW(),
    properties_found = 3035
WHERE id = '819854e7-e158-40c2-9a08-1adc31b75311'
  AND status = 'running';