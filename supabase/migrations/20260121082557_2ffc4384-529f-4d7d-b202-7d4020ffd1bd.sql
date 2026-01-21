UPDATE scout_settings 
SET setting_value = '12'::jsonb
WHERE category = 'scraping' AND setting_key = 'yad2_pages';