-- Fix Madlan properties incorrectly marked as private before today's fix
UPDATE scouted_properties
SET is_private = false
WHERE source = 'madlan'
  AND is_private = true
  AND is_active = true;