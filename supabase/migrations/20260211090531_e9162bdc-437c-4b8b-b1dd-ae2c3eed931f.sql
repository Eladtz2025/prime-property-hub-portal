-- Reset timeout properties so they re-enter the check queue
UPDATE public.scouted_properties 
SET availability_checked_at = NULL,
    availability_check_reason = NULL 
WHERE availability_check_reason = 'per_property_timeout' 
  AND is_active = true;

-- Reactivate the false-positive property awc9nzvc
UPDATE public.scouted_properties 
SET is_active = true,
    status = 'matched',
    availability_checked_at = NULL,
    availability_check_reason = NULL 
WHERE id = 'c38e0834-315d-40a4-9958-8c275dd65f1c';