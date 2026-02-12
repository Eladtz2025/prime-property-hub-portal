
-- Drop existing function to allow return type change
DROP FUNCTION IF EXISTS detect_duplicates_batch(integer);

-- RPC to reset all dedup_checked_at for fresh scan
CREATE OR REPLACE FUNCTION reset_dedup_checked()
RETURNS void AS $$
BEGIN
  UPDATE scouted_properties SET dedup_checked_at = NULL WHERE dedup_checked_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate detect_duplicates_batch with skipped count
CREATE OR REPLACE FUNCTION detect_duplicates_batch(batch_size integer DEFAULT 500)
RETURNS TABLE(properties_processed integer, duplicates_found integer, groups_created integer, properties_skipped integer) AS $$
DECLARE
  v_processed integer := 0;
  v_duplicates integer := 0;
  v_groups integer := 0;
  v_skipped integer := 0;
  v_prop RECORD;
  v_match_id uuid;
  v_group_id uuid;
BEGIN
  -- Step 0: Mark properties missing required fields as checked (skip them)
  UPDATE scouted_properties
  SET dedup_checked_at = NOW()
  WHERE dedup_checked_at IS NULL
    AND is_active = true
    AND (
      address IS NULL OR address = '' 
      OR rooms IS NULL 
      OR city IS NULL OR city = ''
      OR property_type IS NULL OR property_type = ''
    );
  GET DIAGNOSTICS v_skipped = ROW_COUNT;

  -- Step 1: Get batch of unchecked properties
  FOR v_prop IN
    SELECT id, address, city, rooms, size_sqm, property_type, street_number
    FROM scouted_properties
    WHERE dedup_checked_at IS NULL
      AND is_active = true
      AND address IS NOT NULL AND address != ''
      AND rooms IS NOT NULL
      AND city IS NOT NULL AND city != ''
      AND property_type IS NOT NULL AND property_type != ''
    ORDER BY created_at ASC
    LIMIT batch_size
  LOOP
    v_processed := v_processed + 1;

    -- Step 2: Find potential duplicate
    SELECT sp.id, sp.duplicate_group_id INTO v_match_id, v_group_id
    FROM scouted_properties sp
    WHERE sp.id != v_prop.id
      AND sp.is_active = true
      AND sp.city = v_prop.city
      AND sp.address = v_prop.address
      AND sp.property_type = v_prop.property_type
      AND (
        (v_prop.street_number IS NOT NULL AND v_prop.street_number != '' AND sp.street_number = v_prop.street_number)
        OR (v_prop.street_number IS NULL OR v_prop.street_number = '')
      )
      AND sp.rooms IS NOT NULL
      AND ABS(sp.rooms - v_prop.rooms) <= 0.5
      AND (
        v_prop.size_sqm IS NULL OR sp.size_sqm IS NULL
        OR ABS(sp.size_sqm - v_prop.size_sqm) <= GREATEST(v_prop.size_sqm, sp.size_sqm) * 0.2
      )
    LIMIT 1;

    IF v_match_id IS NOT NULL THEN
      v_duplicates := v_duplicates + 1;

      IF v_group_id IS NOT NULL THEN
        UPDATE scouted_properties SET duplicate_group_id = v_group_id WHERE id = v_prop.id AND duplicate_group_id IS NULL;
      ELSE
        v_group_id := gen_random_uuid();
        v_groups := v_groups + 1;
        UPDATE scouted_properties SET duplicate_group_id = v_group_id WHERE id IN (v_prop.id, v_match_id) AND duplicate_group_id IS NULL;
      END IF;
    END IF;

    UPDATE scouted_properties SET dedup_checked_at = NOW() WHERE id = v_prop.id;
  END LOOP;

  IF v_duplicates > 0 THEN
    PERFORM recompute_duplicate_winners();
  END IF;

  RETURN QUERY SELECT v_processed, v_duplicates, v_groups, v_skipped;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
