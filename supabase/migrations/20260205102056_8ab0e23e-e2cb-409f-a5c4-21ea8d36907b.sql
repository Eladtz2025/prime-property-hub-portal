-- Function to recompute winners for all duplicate groups
-- Only service_role can execute (heavy operation that modifies data)
CREATE OR REPLACE FUNCTION recompute_duplicate_winners()
RETURNS TABLE(groups_updated INTEGER, properties_updated INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_groups_updated INTEGER := 0;
  v_properties_updated INTEGER := 0;
BEGIN
  -- Use CTE to rank properties within each duplicate group
  WITH ranked AS (
    SELECT
      id,
      duplicate_group_id,
      ROW_NUMBER() OVER (
        PARTITION BY duplicate_group_id
        ORDER BY
          -- Priority 1: Private (true=2) > Broker (false=1) > Unknown (null=0)
          (CASE WHEN is_private = true THEN 2 
                WHEN is_private = false THEN 1 
                ELSE 0 END) DESC,
          -- Priority 2: Most recently updated
          updated_at DESC NULLS LAST,
          -- Priority 3: Lowest price
          price ASC NULLS LAST,
          -- Priority 4: Oldest (first found)
          created_at ASC
      ) AS rn
    FROM scouted_properties
    WHERE is_active = true
      AND duplicate_group_id IS NOT NULL
  )
  UPDATE scouted_properties sp
  SET is_primary_listing = (ranked.rn = 1)
  FROM ranked
  WHERE sp.id = ranked.id
    AND (sp.is_primary_listing IS DISTINCT FROM (ranked.rn = 1));

  GET DIAGNOSTICS v_properties_updated = ROW_COUNT;
  
  -- Count distinct groups
  SELECT COUNT(DISTINCT duplicate_group_id) INTO v_groups_updated
  FROM scouted_properties
  WHERE is_active = true AND duplicate_group_id IS NOT NULL;
  
  RETURN QUERY SELECT v_groups_updated, v_properties_updated;
END;
$$;

-- ONLY service_role can execute (not authenticated users)
REVOKE EXECUTE ON FUNCTION recompute_duplicate_winners FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION recompute_duplicate_winners FROM authenticated;
GRANT EXECUTE ON FUNCTION recompute_duplicate_winners TO service_role;

COMMENT ON FUNCTION recompute_duplicate_winners IS 'Recomputes is_primary_listing for all duplicate groups. Priority: Private > Broker > Unknown, then updated_at DESC, price ASC, created_at ASC. Only service_role can execute.';

-- Update detect_duplicates_batch to call recompute_winners ONLY when changes were made
CREATE OR REPLACE FUNCTION detect_duplicates_batch(batch_size INTEGER DEFAULT 500)
RETURNS TABLE(duplicates_found INTEGER, groups_created INTEGER, properties_processed INTEGER)
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
        
        -- Mark matched property as primary (temporary, will be recalculated)
        UPDATE scouted_properties
        SET duplicate_group_id = match_group,
            duplicate_detected_at = NOW()
        WHERE id = match_id;
      END IF;
      
      -- Add current property to group
      UPDATE scouted_properties
      SET duplicate_group_id = match_group,
          duplicate_detected_at = NOW()
      WHERE id = rec.id;
    END IF;
  END LOOP;
  
  -- Only recompute winners if we found new duplicates or created groups
  IF v_duplicates_found > 0 OR v_groups_created > 0 THEN
    PERFORM recompute_duplicate_winners();
  END IF;
  
  RETURN QUERY SELECT v_duplicates_found, v_groups_created, v_processed;
END;
$$;

COMMENT ON FUNCTION detect_duplicates_batch IS 'Detects duplicate properties by matching address+city+rooms+floor+size. Automatically recomputes winners when changes are made.';