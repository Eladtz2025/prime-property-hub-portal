-- Fix detect_existing_duplicates function by adding SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.detect_existing_duplicates()
 RETURNS TABLE(duplicates_found integer, groups_created integer, alerts_created integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_duplicates_found INTEGER := 0;
  v_groups_created INTEGER := 0;
  v_alerts_created INTEGER := 0;
  v_group_id UUID;
  v_prop RECORD;
  v_dup RECORD;
  v_price_diff INTEGER;
  v_price_diff_pct NUMERIC;
BEGIN
  -- Find all potential duplicate groups - only for properties with building numbers
  FOR v_prop IN 
    SELECT DISTINCT ON (city, address, rooms, floor, property_type)
      sp.id, sp.city, sp.address, sp.rooms, sp.floor, sp.property_type, sp.price
    FROM scouted_properties sp
    WHERE sp.is_active = true
      AND sp.duplicate_group_id IS NULL
      AND sp.duplicate_check_possible = true
      AND sp.address ~ '[0-9]+'
    ORDER BY city, address, rooms, floor, property_type, created_at ASC
  LOOP
    -- Check if there are duplicates for this property
    FOR v_dup IN 
      SELECT sp.id, sp.price, sp.source
      FROM scouted_properties sp
      WHERE sp.is_active = true
        AND sp.id != v_prop.id
        AND sp.duplicate_group_id IS NULL
        AND sp.duplicate_check_possible = true
        AND sp.address ~ '[0-9]+'
        AND LOWER(TRIM(sp.city)) = LOWER(TRIM(v_prop.city))
        AND LOWER(TRIM(sp.address)) = LOWER(TRIM(v_prop.address))
        AND sp.rooms = v_prop.rooms
        AND COALESCE(sp.floor, 0) = COALESCE(v_prop.floor, 0)
        -- Must be same property type
        AND COALESCE(sp.property_type, 'rental') = COALESCE(v_prop.property_type, 'rental')
    LOOP
      -- Found a duplicate!
      v_duplicates_found := v_duplicates_found + 1;
      
      -- Create group if doesn't exist
      IF v_group_id IS NULL THEN
        v_group_id := gen_random_uuid();
        v_groups_created := v_groups_created + 1;
        
        -- Mark the primary listing
        UPDATE scouted_properties 
        SET duplicate_group_id = v_group_id, 
            is_primary_listing = true,
            duplicate_detected_at = now()
        WHERE id = v_prop.id;
      END IF;
      
      -- Mark the duplicate
      UPDATE scouted_properties 
      SET duplicate_group_id = v_group_id, 
          is_primary_listing = false,
          duplicate_detected_at = now()
      WHERE id = v_dup.id;
      
      -- Check price difference
      IF v_prop.price IS NOT NULL AND v_dup.price IS NOT NULL AND v_prop.price > 0 THEN
        v_price_diff := ABS(v_prop.price - v_dup.price);
        v_price_diff_pct := (v_price_diff::NUMERIC / LEAST(v_prop.price, v_dup.price)) * 100;
        
        -- Create alert if price difference > 5%
        IF v_price_diff_pct > 5 THEN
          INSERT INTO duplicate_alerts (
            primary_property_id, 
            duplicate_property_id, 
            price_difference, 
            price_difference_percent
          ) VALUES (
            v_prop.id, 
            v_dup.id, 
            v_price_diff, 
            v_price_diff_pct
          );
          v_alerts_created := v_alerts_created + 1;
        END IF;
      END IF;
    END LOOP;
    
    -- Reset group for next property
    v_group_id := NULL;
  END LOOP;
  
  RETURN QUERY SELECT v_duplicates_found, v_groups_created, v_alerts_created;
END;
$function$;