-- Update homeless configs to filter private only
UPDATE scout_configs 
SET owner_type_filter = 'private' 
WHERE source = 'homeless' AND (owner_type_filter IS NULL OR owner_type_filter != 'private');

-- Deactivate broker listings from homeless
UPDATE scouted_properties 
SET is_active = false, status = 'inactive' 
WHERE source = 'homeless' AND is_private = false AND is_active = true;

-- Deactivate broker listings from madlan (backfill regression)
UPDATE scouted_properties 
SET is_active = false, status = 'inactive' 
WHERE source = 'madlan' AND is_private = false AND is_active = true;