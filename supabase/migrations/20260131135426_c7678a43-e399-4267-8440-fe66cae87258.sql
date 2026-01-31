-- Fix type mismatch in find_property_duplicate function
DROP FUNCTION IF EXISTS find_property_duplicate(text, text, numeric, integer, integer, uuid);

CREATE OR REPLACE FUNCTION find_property_duplicate(
  p_address TEXT,
  p_city TEXT,
  p_rooms NUMERIC,
  p_floor INTEGER,
  p_size INTEGER DEFAULT NULL,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  source TEXT,
  price INTEGER,
  size INTEGER,
  duplicate_group_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process valid addresses (must contain building number)
  IF p_address IS NULL OR p_address !~ '\d+' THEN
    RETURN;
  END IF;
  
  -- Must have all required fields for duplicate detection
  IF p_rooms IS NULL OR p_floor IS NULL OR p_city IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    sp.id,
    sp.source,
    sp.price,
    sp.size,
    sp.duplicate_group_id
  FROM scouted_properties sp
  WHERE sp.is_active = true
    AND sp.address = p_address           -- Exact address match
    AND sp.city = p_city                 -- Exact city match
    AND sp.rooms = p_rooms               -- Exact rooms match
    AND sp.floor = p_floor               -- Exact floor match
    AND (p_exclude_id IS NULL OR sp.id != p_exclude_id)
    -- Size within 15% tolerance (if both have size data)
    AND (
      p_size IS NULL 
      OR sp.size IS NULL 
      OR p_size = 0 
      OR sp.size = 0
      OR ABS(p_size - sp.size)::FLOAT / GREATEST(p_size::FLOAT, sp.size::FLOAT) <= 0.15
    )
  ORDER BY sp.created_at ASC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION find_property_duplicate TO authenticated;
GRANT EXECUTE ON FUNCTION find_property_duplicate TO service_role;