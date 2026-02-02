-- Fix address field containing broker names and incorrect is_private
-- This cleans up 63+ properties with broker names polluting the address field

UPDATE scouted_properties
SET 
  address = NULL,
  is_private = false
WHERE is_active = true
  AND (
    address LIKE '%שיווק%' OR 
    address LIKE '%נדל"ן%' OR 
    address LIKE '%נכסים%' OR
    address LIKE '%גולדין%' OR
    address LIKE '%LEAD%' OR
    address LIKE '%אבן שהם%' OR
    address LIKE '%Premium%' OR
    address LIKE '%Concord%' OR
    address LIKE '%נדלן%'
  );