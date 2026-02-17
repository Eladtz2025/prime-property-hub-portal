-- Fix all stuck rate_limited and per_property_timeout properties that were created before the fix
UPDATE scouted_properties 
SET availability_checked_at = now(), 
    availability_check_count = 1
WHERE availability_check_reason IN ('rate_limited', 'per_property_timeout') 
  AND availability_checked_at IS NULL;