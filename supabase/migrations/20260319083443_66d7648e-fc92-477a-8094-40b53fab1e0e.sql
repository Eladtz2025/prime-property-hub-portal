-- Reset all duplicate data for fresh re-scan with improved logic
UPDATE scouted_properties 
SET duplicate_group_id = NULL, 
    is_primary_listing = NULL, 
    dedup_checked_at = NULL,
    duplicate_detected_at = NULL
WHERE duplicate_group_id IS NOT NULL 
   OR dedup_checked_at IS NOT NULL 
   OR is_primary_listing IS NOT NULL;