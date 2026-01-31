-- Deactivate specific Yad2 properties that have been removed from the source
UPDATE scouted_properties
SET is_active = false, status = 'inactive'
WHERE id IN (
  'cbf469d5-4d5a-45e7-8709-61ca939aad03',
  'ade2e72d-8d6c-4194-b51e-3600ddfe0089'
);