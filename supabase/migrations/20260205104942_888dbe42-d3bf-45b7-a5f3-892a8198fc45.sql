-- =====================================================
-- 1. CRON: Update availability check to run every 10 minutes
-- =====================================================

-- Remove old daily job
SELECT cron.unschedule('daily-availability-check-v2');

-- Create new continuous cron job (every 10 minutes)
-- Using anon key which is public/safe - function validates internally with service role
SELECT cron.schedule(
  'availability-check-continuous',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/trigger-availability-check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- =====================================================
-- 2. DUPLICATE DETECTION: Enhanced matching logic
-- =====================================================

-- Create address normalization helper function
CREATE OR REPLACE FUNCTION normalize_address_for_matching(addr TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result TEXT;
BEGIN
  IF addr IS NULL THEN RETURN NULL; END IF;
  
  result := addr;
  
  -- Remove common suffixes/prefixes that don't matter
  result := regexp_replace(result, '\s*(דירה|דירת|קומה|קומת)\s*\d*', '', 'gi');
  
  -- Normalize whitespace
  result := regexp_replace(result, '\s+', ' ', 'g');
  result := trim(result);
  
  -- Lowercase for comparison
  result := lower(result);
  
  RETURN result;
END;
$$;

-- Create enhanced duplicate detection function with relaxed matching
CREATE OR REPLACE FUNCTION find_property_duplicate(
  p_address TEXT,
  p_city TEXT,
  p_rooms NUMERIC,
  p_floor INTEGER,
  p_size INTEGER DEFAULT NULL,
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
  -- Normalize the input address
  normalized_addr := normalize_address_for_matching(p_address);
  
  -- Must have city and address
  IF p_city IS NULL OR normalized_addr IS NULL OR normalized_addr = '' THEN
    RETURN;
  END IF;
  
  -- Must have rooms (required for matching)
  IF p_rooms IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    sp.id,
    sp.source,
    sp.price,
    sp.size,
    sp.duplicate_group_id
  FROM scouted_properties sp
  WHERE sp.is_active = true
    AND sp.city = p_city
    AND (p_exclude_id IS NULL OR sp.id != p_exclude_id)
    -- Normalized address match
    AND normalize_address_for_matching(sp.address) = normalized_addr
    -- Rooms within ±0.5 tolerance (3 rooms matches 2.5-3.5)
    AND sp.rooms IS NOT NULL
    AND ABS(sp.rooms - p_rooms) <= 0.5
    -- Floor matching: either both have floor and match, OR either is missing (relaxed)
    AND (
      p_floor IS NULL 
      OR sp.floor IS NULL 
      OR sp.floor = p_floor
    )
    -- Size within 20% tolerance (if both have size data)
    AND (
      p_size IS NULL 
      OR sp.size IS NULL 
      OR p_size = 0 
      OR sp.size = 0
      OR ABS(p_size - sp.size)::FLOAT / GREATEST(p_size::FLOAT, sp.size::FLOAT) <= 0.20
    )
  ORDER BY 
    -- Prefer properties already in a group
    CASE WHEN sp.duplicate_group_id IS NOT NULL THEN 0 ELSE 1 END,
    sp.created_at ASC
  LIMIT 1;
END;
$$;

-- Update detect_duplicates_batch with relaxed requirements
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
  -- Process properties without duplicate_group_id
  -- Relaxed requirements: only need city, address, and rooms
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
      AND sp.address IS NOT NULL
      AND sp.address != ''
      AND sp.rooms IS NOT NULL
      AND sp.city IS NOT NULL
    ORDER BY sp.created_at ASC
    LIMIT batch_size
  LOOP
    v_processed := v_processed + 1;
    
    -- Find existing duplicate using enhanced function
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
        
        -- Mark matched property
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

-- Cleanup: Remove "groups of 1" that shouldn't exist
-- If a property has duplicate_group_id but is alone in its group, clear it
UPDATE scouted_properties sp
SET duplicate_group_id = NULL,
    is_primary_listing = true,
    duplicate_detected_at = NULL
WHERE sp.duplicate_group_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM scouted_properties sp2
    WHERE sp2.duplicate_group_id = sp.duplicate_group_id
      AND sp2.id != sp.id
      AND sp2.is_active = true
  );

COMMENT ON FUNCTION find_property_duplicate IS 'Enhanced duplicate detection with relaxed matching: normalized address, rooms ±0.5, optional floor, size ±20%';
COMMENT ON FUNCTION detect_duplicates_batch IS 'Detects duplicate properties with relaxed matching. Automatically recomputes winners when changes are made.';
COMMENT ON FUNCTION normalize_address_for_matching IS 'Normalizes address for duplicate comparison by removing apartment/floor suffixes and standardizing whitespace';