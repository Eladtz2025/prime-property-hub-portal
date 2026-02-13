
-- 1. Update detect_duplicates_batch: require exact floor match + price tolerance 30%
CREATE OR REPLACE FUNCTION public.detect_duplicates_batch(batch_size integer DEFAULT 500)
RETURNS TABLE(properties_processed integer, duplicates_found integer, groups_created integer, properties_skipped integer)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_processed integer := 0;
  v_duplicates integer := 0;
  v_groups integer := 0;
  v_skipped integer := 0;
  v_prop RECORD;
  v_match_id uuid;
  v_match_price integer;
  v_group_id uuid;
BEGIN
  -- Skip properties missing required fields
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

  FOR v_prop IN
    SELECT id, address, city, rooms, size, floor, property_type, price
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

    SELECT sp.id, sp.duplicate_group_id, sp.price INTO v_match_id, v_group_id, v_match_price
    FROM scouted_properties sp
    WHERE sp.id != v_prop.id
      AND sp.is_active = true
      AND sp.city = v_prop.city
      AND sp.address = v_prop.address
      AND sp.property_type = v_prop.property_type
      AND sp.rooms IS NOT NULL
      AND ABS(sp.rooms - v_prop.rooms) <= 0.5
      AND (
        v_prop.size IS NULL OR sp.size IS NULL
        OR ABS(sp.size - v_prop.size) <= GREATEST(v_prop.size, sp.size) * 0.2
      )
      -- Exact floor match required (NULL does not match anything)
      AND sp.floor = v_prop.floor
      -- Price tolerance: max 30% difference
      AND (
        sp.price IS NULL OR v_prop.price IS NULL
        OR ABS(sp.price - v_prop.price)::FLOAT / GREATEST(sp.price::FLOAT, v_prop.price::FLOAT, 1) <= 0.30
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
$$;

-- 2. Update find_property_duplicate: same floor + price changes
CREATE OR REPLACE FUNCTION public.find_property_duplicate(
  p_address text,
  p_city text,
  p_rooms numeric,
  p_floor integer,
  p_size integer DEFAULT NULL,
  p_property_type text DEFAULT NULL,
  p_exclude_id uuid DEFAULT NULL
)
RETURNS TABLE(id uuid, source text, price integer, size integer, duplicate_group_id uuid)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  normalized_addr TEXT;
BEGIN
  normalized_addr := public.normalize_address_for_matching(p_address);

  IF p_city IS NULL OR normalized_addr IS NULL OR normalized_addr = '' THEN RETURN; END IF;
  IF p_rooms IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT sp.id, sp.source, sp.price, sp.size, sp.duplicate_group_id
  FROM public.scouted_properties sp
  WHERE sp.is_active = true
    AND sp.city = p_city
    AND (p_exclude_id IS NULL OR sp.id <> p_exclude_id)
    AND public.normalize_address_for_matching(sp.address) = normalized_addr
    AND sp.rooms IS NOT NULL
    AND ABS(sp.rooms - p_rooms) <= 0.5
    -- Exact floor match required (NULL does not match)
    AND sp.floor = p_floor
    AND (
      p_size IS NULL OR sp.size IS NULL OR p_size = 0 OR sp.size = 0
      OR ABS(p_size - sp.size)::FLOAT / GREATEST(p_size::FLOAT, sp.size::FLOAT) <= 0.20
    )
    AND (p_property_type IS NULL OR sp.property_type = p_property_type)
  ORDER BY
    CASE WHEN sp.duplicate_group_id IS NOT NULL THEN 0 ELSE 1 END,
    sp.created_at ASC
  LIMIT 1;
END;
$$;

-- 3. Reset all duplicate data for fresh re-scan with new logic
UPDATE scouted_properties SET 
  duplicate_group_id = NULL, 
  is_primary_listing = true, 
  duplicate_detected_at = NULL, 
  dedup_checked_at = NULL 
WHERE duplicate_group_id IS NOT NULL OR dedup_checked_at IS NOT NULL;
