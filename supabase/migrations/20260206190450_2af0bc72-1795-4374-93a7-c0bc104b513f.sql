-- 0) Drop ALL overloads to avoid ambiguity
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'find_property_duplicate'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s);', r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- 1) Recreate find_property_duplicate (MUST match property_type)
CREATE OR REPLACE FUNCTION public.find_property_duplicate(
  p_address TEXT,
  p_city TEXT,
  p_rooms NUMERIC,
  p_floor INTEGER,
  p_size INTEGER DEFAULT NULL,
  p_property_type TEXT DEFAULT NULL,
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
    AND (p_floor IS NULL OR sp.floor IS NULL OR sp.floor = p_floor)
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

-- 2) Update detect_duplicates_batch to pass property_type
CREATE OR REPLACE FUNCTION public.detect_duplicates_batch(batch_size INTEGER DEFAULT 500)
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
  FOR rec IN
    SELECT sp.id, sp.address, sp.city, sp.rooms, sp.floor, sp.size, sp.property_type
    FROM public.scouted_properties sp
    WHERE sp.is_active = true
      AND sp.duplicate_group_id IS NULL
      AND sp.address IS NOT NULL AND sp.address <> ''
      AND sp.rooms IS NOT NULL
      AND sp.city IS NOT NULL
      AND sp.property_type IS NOT NULL
    ORDER BY sp.created_at ASC
    LIMIT batch_size
  LOOP
    v_processed := v_processed + 1;

    SELECT d.id, d.duplicate_group_id
      INTO match_id, match_group
    FROM public.find_property_duplicate(
      rec.address,
      rec.city,
      rec.rooms,
      rec.floor,
      rec.size::INTEGER,
      rec.property_type,
      rec.id
    ) d
    LIMIT 1;

    IF match_id IS NOT NULL THEN
      v_duplicates_found := v_duplicates_found + 1;

      IF match_group IS NULL THEN
        match_group := match_id;
        v_groups_created := v_groups_created + 1;

        UPDATE public.scouted_properties
        SET duplicate_group_id = match_group,
            duplicate_detected_at = NOW()
        WHERE id = match_id;
      END IF;

      UPDATE public.scouted_properties
      SET duplicate_group_id = match_group,
          duplicate_detected_at = NOW()
      WHERE id = rec.id;
    END IF;
  END LOOP;

  IF v_duplicates_found > 0 OR v_groups_created > 0 THEN
    PERFORM public.recompute_duplicate_winners();
  END IF;

  RETURN QUERY SELECT v_duplicates_found, v_groups_created, v_processed;
END;
$$;

-- 3) Guard: ensure only one overload exists
DO $$
DECLARE c int;
BEGIN
  SELECT COUNT(*) INTO c
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'find_property_duplicate';

  IF c <> 1 THEN
    RAISE EXCEPTION 'find_property_duplicate overloads detected: % (expected exactly 1)', c;
  END IF;
END $$;

-- 4) Recompute winners (safe)
SELECT public.recompute_duplicate_winners();