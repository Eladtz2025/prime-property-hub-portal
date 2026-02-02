-- First, update the status constraint to allow 'duplicate_cross_source'
ALTER TABLE scouted_properties DROP CONSTRAINT scouted_properties_status_check;

ALTER TABLE scouted_properties ADD CONSTRAINT scouted_properties_status_check 
CHECK (status = ANY (ARRAY['new'::text, 'matched'::text, 'imported'::text, 'archived'::text, 'inactive'::text, 'duplicate_cross_source'::text]));

-- Now deactivate cross-source duplicate properties (keep the one with more features data)
WITH cross_source_duplicates AS (
  SELECT 
    a.id as id_a,
    b.id as id_b,
    a.source as source_a,
    b.source as source_b,
    a.address,
    a.city,
    a.rooms,
    -- Count features in each record
    (SELECT COUNT(*) FROM jsonb_object_keys(COALESCE(a.features, '{}'::jsonb))) as features_count_a,
    (SELECT COUNT(*) FROM jsonb_object_keys(COALESCE(b.features, '{}'::jsonb))) as features_count_b,
    -- Determine which one to keep (more features = keep)
    CASE 
      WHEN (SELECT COUNT(*) FROM jsonb_object_keys(COALESCE(a.features, '{}'::jsonb))) >=
           (SELECT COUNT(*) FROM jsonb_object_keys(COALESCE(b.features, '{}'::jsonb)))
      THEN b.id  -- deactivate b
      ELSE a.id  -- deactivate a
    END as id_to_deactivate
  FROM scouted_properties a
  JOIN scouted_properties b ON 
    a.city = b.city AND
    a.address = b.address AND
    a.rooms = b.rooms AND
    ABS(COALESCE(a.price, 0) - COALESCE(b.price, 0)) < 500
  WHERE a.is_active = true 
    AND b.is_active = true
    AND a.source != b.source
    AND a.id < b.id  -- Avoid duplicate pairs
    AND a.address IS NOT NULL
    AND a.address != ''
    AND a.rooms IS NOT NULL
)
UPDATE scouted_properties
SET 
  is_active = false, 
  status = 'duplicate_cross_source',
  matched_leads = '[]'::jsonb,
  updated_at = now()
WHERE id IN (SELECT DISTINCT id_to_deactivate FROM cross_source_duplicates);