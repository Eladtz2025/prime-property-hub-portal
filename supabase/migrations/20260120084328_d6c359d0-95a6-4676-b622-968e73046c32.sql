-- Increase Madlan pages from 2 to 15 for better coverage (auto proxy costs only 1 credit)
UPDATE scout_settings 
SET setting_value = '15', updated_at = now()
WHERE category = 'scraping' AND setting_key = 'madlan_pages';