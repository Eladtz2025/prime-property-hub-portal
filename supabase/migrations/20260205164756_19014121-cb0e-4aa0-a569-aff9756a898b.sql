
-- ========================================
-- Step 1: Cleanup invalid Madlan URLs (search pages, not listings)
-- ========================================
UPDATE scouted_properties
SET 
  is_active = false,
  status = 'inactive',
  availability_check_reason = 'invalid_listing_url'
WHERE source = 'madlan'
  AND (source_url LIKE '%/for-rent/%' OR source_url LIKE '%/for-sale/%')
  AND is_active = true;

-- ========================================
-- Step 2: Delete duplicate (source, source_url) rows
-- Keep: active first, then newest updated_at
-- No FKs reference scouted_properties(id), safe to delete
-- ========================================
WITH ranked AS (
  SELECT
    id,
    source,
    source_url,
    ROW_NUMBER() OVER (
      PARTITION BY source, source_url
      ORDER BY
        (CASE WHEN is_active THEN 0 ELSE 1 END),
        updated_at DESC NULLS LAST,
        created_at DESC
    ) AS rn
  FROM scouted_properties
  WHERE source_url IS NOT NULL
    AND TRIM(source_url) <> ''
)
DELETE FROM scouted_properties sp
USING ranked r
WHERE sp.id = r.id
  AND r.rn > 1;

-- ========================================
-- Step 3: Drop old partial index (only on source_url for active)
-- ========================================
DROP INDEX IF EXISTS scouted_properties_source_url_unique_active;

-- ========================================
-- Step 4: Create new unique index on (source, source_url)
-- Includes TRIM check as requested
-- ========================================
CREATE UNIQUE INDEX scouted_properties_source_url_unique
ON scouted_properties(source, source_url)
WHERE source_url IS NOT NULL AND TRIM(source_url) <> '';
