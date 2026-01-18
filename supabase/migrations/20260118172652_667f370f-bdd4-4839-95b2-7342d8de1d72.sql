-- Step 1: Clean up existing duplicate data
UPDATE scouted_properties 
SET duplicate_group_id = NULL, 
    duplicate_detected_at = NULL,
    is_primary_listing = NULL
WHERE duplicate_group_id IS NOT NULL;

DELETE FROM duplicate_alerts;

-- Step 2: Update detect_existing_duplicates with OR logic
CREATE OR REPLACE FUNCTION public.detect_existing_duplicates()
 RETURNS TABLE(duplicates_found integer, groups_created integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_duplicates_found INTEGER := 0;
  v_groups_created INTEGER := 0;
  rec RECORD;
  existing_group_id UUID;
BEGIN
  FOR rec IN 
    SELECT DISTINCT ON (a.id)
      a.id as property_a_id,
      b.id as property_b_id,
      a.address,
      a.rooms,
      a.floor,
      a.property_type,
      a.city,
      a.price as price_a,
      b.price as price_b,
      a.size as size_a,
      b.size as size_b,
      b.duplicate_group_id as existing_group_id
    FROM scouted_properties a
    JOIN scouted_properties b ON 
      a.address = b.address
      AND a.rooms = b.rooms
      AND a.floor = b.floor
      AND a.property_type = b.property_type
      AND a.city = b.city
      AND a.id != b.id
      AND a.is_active = true
      AND b.is_active = true
      AND a.created_at > b.created_at
      AND a.address ~ '\d+'
      -- FIXED: Use OR logic - not a duplicate if EITHER size OR price differs significantly
      AND NOT (
        (a.size IS NOT NULL AND b.size IS NOT NULL 
         AND a.size > 0 AND b.size > 0
         AND ABS(a.size - b.size)::FLOAT / GREATEST(a.size, b.size) > 0.10)
        OR
        (a.price IS NOT NULL AND b.price IS NOT NULL 
         AND a.price > 0 AND b.price > 0
         AND ABS(a.price - b.price)::FLOAT / GREATEST(a.price, b.price) > 0.20)
      )
    WHERE a.duplicate_group_id IS NULL
    ORDER BY a.id, b.created_at ASC
  LOOP
    v_duplicates_found := v_duplicates_found + 1;
    
    IF rec.existing_group_id IS NOT NULL THEN
      existing_group_id := rec.existing_group_id;
    ELSE
      existing_group_id := rec.property_b_id;
      v_groups_created := v_groups_created + 1;
      
      UPDATE scouted_properties
      SET duplicate_group_id = existing_group_id,
          duplicate_detected_at = NOW(),
          is_primary_listing = true
      WHERE id = rec.property_b_id;
    END IF;
    
    UPDATE scouted_properties
    SET duplicate_group_id = existing_group_id,
        duplicate_detected_at = NOW(),
        is_primary_listing = false
    WHERE id = rec.property_a_id;
    
    IF rec.price_a IS NOT NULL AND rec.price_b IS NOT NULL 
       AND rec.price_a > 0 AND rec.price_b > 0 THEN
      DECLARE
        price_diff NUMERIC := ABS(rec.price_a - rec.price_b);
        price_diff_pct NUMERIC := (price_diff / LEAST(rec.price_a, rec.price_b)) * 100;
      BEGIN
        IF price_diff_pct > 5 THEN
          INSERT INTO duplicate_alerts (
            primary_property_id,
            duplicate_property_id,
            price_difference,
            price_difference_percent
          ) VALUES (
            rec.property_b_id,
            rec.property_a_id,
            price_diff,
            price_diff_pct
          )
          ON CONFLICT DO NOTHING;
        END IF;
      END;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_duplicates_found, v_groups_created;
END;
$function$;

-- Step 3: Update find_duplicate_property with same OR logic
CREATE OR REPLACE FUNCTION public.find_duplicate_property(
  p_address text, 
  p_rooms numeric, 
  p_floor integer, 
  p_property_type text, 
  p_city text,
  p_size numeric DEFAULT NULL,
  p_price numeric DEFAULT NULL,
  p_exclude_id uuid DEFAULT NULL
)
 RETURNS TABLE(id uuid, source text, price numeric, size numeric, duplicate_group_id uuid, duplicate_detected_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.source,
    sp.price,
    sp.size,
    sp.duplicate_group_id,
    sp.duplicate_detected_at
  FROM scouted_properties sp
  WHERE sp.is_active = true
    AND sp.address = p_address
    AND sp.rooms = p_rooms
    AND sp.floor = p_floor
    AND sp.property_type = p_property_type
    AND sp.city = p_city
    AND (p_exclude_id IS NULL OR sp.id != p_exclude_id)
    -- FIXED: Use OR logic for size/price validation
    AND NOT (
      (p_size IS NOT NULL AND sp.size IS NOT NULL 
       AND p_size > 0 AND sp.size > 0
       AND ABS(p_size - sp.size)::FLOAT / GREATEST(p_size, sp.size) > 0.10)
      OR
      (p_price IS NOT NULL AND sp.price IS NOT NULL 
       AND p_price > 0 AND sp.price > 0
       AND ABS(p_price - sp.price)::FLOAT / GREATEST(p_price, sp.price) > 0.20)
    )
  ORDER BY sp.created_at ASC
  LIMIT 1;
END;
$function$;