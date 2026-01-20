-- Update madlan_delay_ms to 8000 for better anti-blocking
UPDATE scout_settings 
SET setting_value = '8000'
WHERE category = 'scraping' AND setting_key = 'madlan_delay_ms';