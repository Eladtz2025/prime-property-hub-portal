-- Add column to track if duplicate check is possible
ALTER TABLE scouted_properties 
ADD COLUMN IF NOT EXISTS duplicate_check_possible BOOLEAN DEFAULT true;

-- Update existing properties - only those with building numbers can be checked
UPDATE scouted_properties
SET duplicate_check_possible = (address ~ '[0-9]+')
WHERE is_active = true;

-- Clean up existing duplicate alerts that were created with invalid data
-- (addresses without building numbers or mixed property types)
DELETE FROM duplicate_alerts
WHERE primary_property_id IN (
  SELECT id FROM scouted_properties 
  WHERE address !~ '[0-9]+'
)
OR duplicate_property_id IN (
  SELECT id FROM scouted_properties 
  WHERE address !~ '[0-9]+'
);

-- Also delete alerts where property types don't match
DELETE FROM duplicate_alerts da
WHERE EXISTS (
  SELECT 1 FROM scouted_properties sp1, scouted_properties sp2
  WHERE da.primary_property_id = sp1.id
    AND da.duplicate_property_id = sp2.id
    AND COALESCE(sp1.property_type, 'rental') != COALESCE(sp2.property_type, 'rental')
);

-- Reset duplicate_group_id for properties that shouldn't have been grouped
UPDATE scouted_properties
SET duplicate_group_id = NULL,
    is_primary_listing = NULL,
    duplicate_detected_at = NULL
WHERE address !~ '[0-9]+';

-- Also reset groups with mixed property types
WITH mixed_groups AS (
  SELECT duplicate_group_id
  FROM scouted_properties
  WHERE duplicate_group_id IS NOT NULL
  GROUP BY duplicate_group_id
  HAVING COUNT(DISTINCT COALESCE(property_type, 'rental')) > 1
)
UPDATE scouted_properties
SET duplicate_group_id = NULL,
    is_primary_listing = NULL,
    duplicate_detected_at = NULL
WHERE duplicate_group_id IN (SELECT duplicate_group_id FROM mixed_groups);

-- Update find_duplicate_property function with smarter logic
CREATE OR REPLACE FUNCTION public.find_duplicate_property(
  p_address text, 
  p_rooms numeric, 
  p_floor integer, 
  p_property_type text, 
  p_city text, 
  p_exclude_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(id uuid, source text, price integer, source_url text, duplicate_group_id uuid, title text)
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  -- Only proceed if address contains a building number
  IF p_address !~ '[0-9]+' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    sp.id, 
    sp.source, 
    sp.price, 
    sp.source_url,
    sp.duplicate_group_id,
    sp.title
  FROM scouted_properties sp
  WHERE sp.is_active = true
    AND sp.duplicate_check_possible = true
    AND sp.address ~ '[0-9]+'
    AND LOWER(TRIM(sp.city)) = LOWER(TRIM(p_city))
    AND LOWER(TRIM(sp.address)) = LOWER(TRIM(p_address))
    AND sp.rooms = p_rooms
    AND COALESCE(sp.floor, 0) = COALESCE(p_floor, 0)
    -- Must be same property type (rent vs sale)
    AND COALESCE(sp.property_type, 'rental') = COALESCE(p_property_type, 'rental')
    AND (p_exclude_id IS NULL OR sp.id != p_exclude_id)
  ORDER BY sp.created_at ASC
  LIMIT 10;
END;
$function$;

-- Update detect_existing_duplicates function
CREATE OR REPLACE FUNCTION public.detect_existing_duplicates()
RETURNS TABLE(duplicates_found integer, groups_created integer, alerts_created integer)
LANGUAGE plpgsql
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