
-- Reset availability check for all matched properties so they re-enter the queue
UPDATE scouted_properties 
SET availability_checked_at = null, 
    availability_check_reason = null 
WHERE is_active = true 
  AND matched_leads IS NOT NULL 
  AND jsonb_array_length(matched_leads) > 0
  AND availability_checked_at IS NOT NULL;
