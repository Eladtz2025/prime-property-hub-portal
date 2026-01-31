-- =====================================================
-- REBUILD DUPLICATE DETECTION SYSTEM
-- =====================================================

-- 1. Clear all existing duplicate data from scouted_properties
UPDATE scouted_properties
SET 
  duplicate_group_id = NULL,
  is_primary_listing = true,
  duplicate_detected_at = NULL
WHERE duplicate_group_id IS NOT NULL;

-- 2. Clear all duplicate alerts (table will be unused)
DELETE FROM duplicate_alerts;

-- 3. Drop old duplicate detection functions (all overloaded versions)
DROP FUNCTION IF EXISTS find_duplicate_property(text, numeric, integer, text, text, uuid);
DROP FUNCTION IF EXISTS find_duplicate_property(text, numeric, integer, text, text, numeric, uuid);
DROP FUNCTION IF EXISTS find_duplicate_property(text, numeric, integer, text, text, numeric, numeric, uuid);
DROP FUNCTION IF EXISTS detect_existing_duplicates();

-- 4. Create new strict duplicate detection function
-- Requirements: exact address+city+rooms+floor match, optional size within 15%
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
  price NUMERIC,
  size NUMERIC,
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
    AND sp.floor = p_floor               -- Exact floor match (NEW requirement!)
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

-- 5. Create batch duplicate detection function for scanning existing properties
CREATE OR REPLACE FUNCTION detect_duplicates_batch(batch_size INTEGER DEFAULT 500)
RETURNS TABLE(
  duplicates_found INTEGER,
  groups_created INTEGER,
  properties_processed INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duplicates_found INTEGER := 0;
  v_groups_created INTEGER := 0;
  v_processed INTEGER := 0;
  rec RECORD;
  match_id UUID;
  match_group UUID;
BEGIN
  -- Process properties without duplicate_group_id that have valid data
  FOR rec IN 
    SELECT 
      sp.id,
      sp.address,
      sp.city,
      sp.rooms,
      sp.floor,
      sp.size
    FROM scouted_properties sp
    WHERE sp.is_active = true
      AND sp.duplicate_group_id IS NULL
      AND sp.address ~ '\d+'           -- Has building number in address
      AND sp.rooms IS NOT NULL
      AND sp.floor IS NOT NULL
      AND sp.city IS NOT NULL
    ORDER BY sp.created_at ASC
    LIMIT batch_size
  LOOP
    v_processed := v_processed + 1;
    
    -- Find existing duplicate using new strict function
    SELECT d.id, d.duplicate_group_id INTO match_id, match_group
    FROM find_property_duplicate(
      rec.address, 
      rec.city, 
      rec.rooms, 
      rec.floor, 
      rec.size::INTEGER, 
      rec.id  -- exclude self
    ) d
    LIMIT 1;
    
    IF match_id IS NOT NULL THEN
      v_duplicates_found := v_duplicates_found + 1;
      
      IF match_group IS NULL THEN
        -- Create new group using the matched property's ID as group ID
        match_group := match_id;
        v_groups_created := v_groups_created + 1;
        
        -- Mark matched property as primary
        UPDATE scouted_properties
        SET duplicate_group_id = match_group,
            duplicate_detected_at = NOW(),
            is_primary_listing = true
        WHERE id = match_id;
      END IF;
      
      -- Add current property to group as secondary
      UPDATE scouted_properties
      SET duplicate_group_id = match_group,
          duplicate_detected_at = NOW(),
          is_primary_listing = false
      WHERE id = rec.id;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_duplicates_found, v_groups_created, v_processed;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION find_property_duplicate TO authenticated;
GRANT EXECUTE ON FUNCTION find_property_duplicate TO service_role;
GRANT EXECUTE ON FUNCTION detect_duplicates_batch TO authenticated;
GRANT EXECUTE ON FUNCTION detect_duplicates_batch TO service_role;