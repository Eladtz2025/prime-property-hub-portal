-- ============================================
-- Deduplicate scouted_properties by source_url
-- Keeps the NEWEST record (usually has better data from recent scrapes)
-- Marks older duplicates as inactive
-- ============================================

-- Find and mark duplicates (keeping newest active)
WITH duplicate_groups AS (
  SELECT 
    source_url,
    array_agg(id ORDER BY created_at DESC) as ids,
    COUNT(*) as cnt
  FROM scouted_properties
  WHERE is_active = true
    AND source_url IS NOT NULL
    AND source_url != ''
  GROUP BY source_url
  HAVING COUNT(*) > 1
),
ids_to_deactivate AS (
  SELECT unnest(ids[2:]) as id  -- Keep first (newest), deactivate rest
  FROM duplicate_groups
)
UPDATE scouted_properties
SET 
  is_active = false,
  status = 'inactive',
  updated_at = now()
WHERE id IN (SELECT id FROM ids_to_deactivate);

-- Add unique partial index to prevent future duplicates on source_url
CREATE UNIQUE INDEX IF NOT EXISTS scouted_properties_source_url_unique_active 
ON scouted_properties (source_url) 
WHERE is_active = true AND source_url IS NOT NULL AND source_url != '';