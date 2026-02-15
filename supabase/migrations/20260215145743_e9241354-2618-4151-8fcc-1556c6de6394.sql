-- Clean up dirty availability_check_reason from failed 402 runs
UPDATE scouted_properties 
SET availability_check_reason = null 
WHERE availability_check_reason = 'firecrawl_failed_after_retries' 
  AND (availability_checked_at IS NULL OR availability_check_count = 0);