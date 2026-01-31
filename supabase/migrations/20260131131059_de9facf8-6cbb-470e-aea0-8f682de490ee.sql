-- Reset all is_private values to NULL for reclassification
UPDATE scouted_properties
SET is_private = NULL
WHERE is_active = true;