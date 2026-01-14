-- Create optimized function to get matches for a specific customer
CREATE OR REPLACE FUNCTION get_customer_matches(customer_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  city TEXT,
  price INTEGER,
  rooms INTEGER,
  size INTEGER,
  source TEXT,
  source_url TEXT,
  is_private BOOLEAN,
  match_score INTEGER,
  match_reasons TEXT[]
) AS $$
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
    ARRAY(SELECT jsonb_array_elements_text(match_data->'reasons')) as match_reasons
  FROM scouted_properties sp,
    jsonb_array_elements(sp.matched_leads) AS match_data
  WHERE match_data->>'lead_id' = customer_uuid::TEXT
    AND sp.is_active = true
  ORDER BY (match_data->>'score')::INTEGER DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add GIN index for faster JSONB searches on matched_leads
CREATE INDEX IF NOT EXISTS idx_scouted_properties_matched_leads 
ON scouted_properties USING GIN (matched_leads);