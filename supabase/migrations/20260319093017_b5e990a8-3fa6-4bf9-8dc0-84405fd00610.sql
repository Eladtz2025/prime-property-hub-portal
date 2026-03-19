-- Deactivate 4 duplicate Arlozorov 182 listings, keep the primary (e308f0ab)
UPDATE scouted_properties 
SET is_active = false, 
    status = 'inactive', 
    availability_check_reason = 'merged_same_source_duplicate',
    updated_at = now()
WHERE id IN (
  'b68893cb-b3fe-4ce0-b2b9-193b3bf4d790',
  '1e39ba4d-38fa-4712-9cea-e0b159e21afe',
  'eed4a8c5-38c3-4064-adc8-f39be9c6a65b',
  '5e6facd1-6cae-4696-8519-c309dd093fdb'
);

-- Clean up the orphan group since only one member remains
SELECT cleanup_orphan_duplicate_groups();