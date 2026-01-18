-- Add duplicate tracking columns to scouted_properties
ALTER TABLE scouted_properties 
ADD COLUMN IF NOT EXISTS duplicate_group_id UUID,
ADD COLUMN IF NOT EXISTS is_primary_listing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS duplicate_detected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS owner_phone TEXT;

-- Create duplicate alerts table for price difference notifications
CREATE TABLE IF NOT EXISTS duplicate_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_property_id UUID REFERENCES scouted_properties(id) ON DELETE CASCADE,
  duplicate_property_id UUID REFERENCES scouted_properties(id) ON DELETE CASCADE,
  price_difference INTEGER NOT NULL,
  price_difference_percent NUMERIC(5,2) NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT now(),
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on duplicate_alerts
ALTER TABLE duplicate_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for duplicate_alerts
CREATE POLICY "Authenticated users can view duplicate alerts"
ON duplicate_alerts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert duplicate alerts"
ON duplicate_alerts FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update duplicate alerts"
ON duplicate_alerts FOR UPDATE
TO authenticated
USING (true);

-- Index for fast duplicate checking
CREATE INDEX IF NOT EXISTS idx_scouted_duplicate_check 
ON scouted_properties(city, address, rooms, floor, property_type) 
WHERE is_active = true;

-- Index for duplicate group lookups
CREATE INDEX IF NOT EXISTS idx_scouted_duplicate_group 
ON scouted_properties(duplicate_group_id) 
WHERE duplicate_group_id IS NOT NULL;

-- Function to find duplicate properties
CREATE OR REPLACE FUNCTION find_duplicate_property(
  p_address TEXT,
  p_rooms NUMERIC,
  p_floor INTEGER,
  p_property_type TEXT,
  p_city TEXT,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  source TEXT,
  price INTEGER,
  source_url TEXT,
  duplicate_group_id UUID,
  title TEXT
) AS $$
BEGIN
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
    AND LOWER(TRIM(sp.city)) = LOWER(TRIM(p_city))
    AND LOWER(TRIM(sp.address)) = LOWER(TRIM(p_address))
    AND sp.rooms = p_rooms
    AND COALESCE(sp.floor, 0) = COALESCE(p_floor, 0)
    AND COALESCE(sp.property_type, 'rental') = COALESCE(p_property_type, 'rental')
    AND (p_exclude_id IS NULL OR sp.id != p_exclude_id)
  ORDER BY sp.created_at ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to detect and mark duplicates for existing properties (batch process)
CREATE OR REPLACE FUNCTION detect_existing_duplicates()
RETURNS TABLE(
  duplicates_found INTEGER,
  groups_created INTEGER,
  alerts_created INTEGER
) AS $$
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
  -- Find all potential duplicate groups
  FOR v_prop IN 
    SELECT DISTINCT ON (city, address, rooms, floor, property_type)
      sp.id, sp.city, sp.address, sp.rooms, sp.floor, sp.property_type, sp.price
    FROM scouted_properties sp
    WHERE sp.is_active = true
      AND sp.duplicate_group_id IS NULL
    ORDER BY city, address, rooms, floor, property_type, created_at ASC
  LOOP
    -- Check if there are duplicates for this property
    FOR v_dup IN 
      SELECT sp.id, sp.price, sp.source
      FROM scouted_properties sp
      WHERE sp.is_active = true
        AND sp.id != v_prop.id
        AND sp.duplicate_group_id IS NULL
        AND LOWER(TRIM(sp.city)) = LOWER(TRIM(v_prop.city))
        AND LOWER(TRIM(sp.address)) = LOWER(TRIM(v_prop.address))
        AND sp.rooms = v_prop.rooms
        AND COALESCE(sp.floor, 0) = COALESCE(v_prop.floor, 0)
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
$$ LANGUAGE plpgsql;