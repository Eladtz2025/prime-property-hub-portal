-- Remove unused delay settings from scraping category
DELETE FROM scout_settings 
WHERE category = 'scraping' 
AND setting_key IN ('delay_between_requests_ms', 'madlan_delay_ms');