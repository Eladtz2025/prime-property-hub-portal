-- Simplified duplicate detection: address + rooms + city + floor + price (within 20%)
-- Removed size threshold requirement

CREATE OR REPLACE FUNCTION public.find_duplicate_property(
  p_address text, 
  p_rooms numeric, 
  p_floor integer, 
  p_property_type text, 
  p_city text, 
  p_price numeric DEFAULT NULL::numeric, 
  p_exclude_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  id uuid, 
  source text, 
  price numeric, 
  size numeric, 
  duplicate_group_id uuid, 
  duplicate_detected_at timestamp with time zone
)
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
    -- Only check price difference (up to 20%)
    AND (
      -- If either price is null, skip price check
      p_price IS NULL 
      OR sp.price IS NULL 
      OR p_price = 0 
      OR sp.price = 0
      -- Or prices are within 20% of each other
      OR ABS(p_price - sp.price)::FLOAT / GREATEST(p_price, sp.price) <= 0.20
    )
  ORDER BY sp.created_at ASC
  LIMIT 1;
END;
$function$;

-- Also update detect_existing_duplicates to use simplified logic
CREATE OR REPLACE FUNCTION public.detect_existing_duplicates()
RETURNS TABLE(duplicates_found integer, groups_created integer)
LANGUAGE plpgsql
AS $function$
DECLARE
  v_duplicates_found INTEGER := 0;
  v_groups_created INTEGER := 0;
  rec RECORD;
  existing_group_id UUID;
  price_diff NUMERIC;
  price_diff_pct NUMERIC;
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
      -- Price must be within 20% OR one/both are null/zero
      AND (
        a.price IS NULL OR b.price IS NULL
        OR a.price = 0 OR b.price = 0
        OR ABS(a.price - b.price)::FLOAT / GREATEST(a.price, b.price) <= 0.20
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
    
    -- Calculate price difference for logging (no alerts created)
    IF rec.price_a IS NOT NULL AND rec.price_b IS NOT NULL 
       AND rec.price_a > 0 AND rec.price_b > 0 THEN
      price_diff := ABS(rec.price_a - rec.price_b);
      price_diff_pct := (price_diff / LEAST(rec.price_a, rec.price_b)) * 100;
    ELSE
      price_diff := 0;
      price_diff_pct := 0;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_duplicates_found, v_groups_created;
END;
$function$;