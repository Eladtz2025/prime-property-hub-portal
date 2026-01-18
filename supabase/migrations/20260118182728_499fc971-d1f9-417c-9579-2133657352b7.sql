-- Fix duplicate detection to not require exact floor match
-- This allows detecting duplicates like Amos 6 where floor is reported differently by different sources

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
      a.size as size_a,
      b.size as size_b,
      b.duplicate_group_id as existing_group_id
    FROM scouted_properties a
    JOIN scouted_properties b ON 
      a.address = b.address
      AND a.rooms = b.rooms
      -- REMOVED: AND a.floor = b.floor (floors are often reported differently by sources)
      AND a.property_type = b.property_type
      AND a.city = b.city
      AND a.id != b.id
      AND a.is_active = true
      AND b.is_active = true
      AND a.created_at > b.created_at
      AND a.address ~ '\d+'
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
      price_diff := ABS(rec.price_a - rec.price_b);
      price_diff_pct := (price_diff / LEAST(rec.price_a, rec.price_b)) * 100;
    ELSE
      price_diff := 0;
      price_diff_pct := 0;
    END IF;
    
    INSERT INTO duplicate_alerts (
      primary_property_id,
      duplicate_property_id,
      price_difference,
      price_difference_percent
    ) VALUES (
      rec.property_b_id,
      rec.property_a_id,
      COALESCE(price_diff, 0),
      COALESCE(price_diff_pct, 0)
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RETURN QUERY SELECT v_duplicates_found, v_groups_created;
END;
$function$;