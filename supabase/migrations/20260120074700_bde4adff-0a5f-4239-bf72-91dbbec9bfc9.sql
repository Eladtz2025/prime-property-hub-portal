-- Update homeless_pages setting from 0 to 5
UPDATE scout_settings 
SET setting_value = '5'
WHERE category = 'scraping' AND setting_key = 'homeless_pages';