
UPDATE scout_settings SET setting_value = '8000' 
WHERE category = 'availability' AND setting_key = 'delay_between_batches_ms';

UPDATE scout_settings SET setting_value = '3' 
WHERE category = 'availability' AND setting_key = 'firecrawl_max_retries';

UPDATE scout_settings SET setting_value = '5000' 
WHERE category = 'availability' AND setting_key = 'firecrawl_retry_delay_ms';

UPDATE scouted_properties 
SET availability_checked_at = NULL, availability_check_reason = NULL, availability_check_count = 0
WHERE availability_check_reason = 'rate_limited' AND is_active = true;
