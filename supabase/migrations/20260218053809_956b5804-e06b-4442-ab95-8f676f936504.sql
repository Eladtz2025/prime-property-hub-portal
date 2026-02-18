UPDATE scouted_properties
SET 
  availability_checked_at = NULL,
  availability_check_reason = NULL,
  availability_check_count = 0
WHERE availability_check_reason IN ('jina_failed_after_retries', 'rate_limited')
  AND is_active = true;