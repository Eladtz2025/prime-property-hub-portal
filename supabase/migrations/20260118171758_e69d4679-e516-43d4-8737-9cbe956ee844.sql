-- Reset all duplicate markings
UPDATE scouted_properties
SET duplicate_group_id = NULL,
    is_primary_listing = true,
    duplicate_detected_at = NULL
WHERE duplicate_group_id IS NOT NULL;

-- Delete all duplicate alerts
DELETE FROM duplicate_alerts;