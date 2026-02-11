-- Update availability settings for better timeout management
UPDATE scout_settings SET setting_value = '6' WHERE category = 'availability' AND setting_key = 'batch_size';
UPDATE scout_settings SET setting_value = '1' WHERE category = 'availability' AND setting_key = 'firecrawl_max_retries';
UPDATE scout_settings SET setting_value = '15000' WHERE category = 'availability' AND setting_key = 'per_property_timeout_ms';
UPDATE scout_settings SET setting_value = '3' WHERE category = 'availability' AND setting_key = 'concurrency_limit';