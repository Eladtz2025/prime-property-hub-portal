-- Reduce Madlan pages from 4 to 2 to optimize credits (stealth proxy costs 5 credits per request)
UPDATE scout_settings 
SET setting_value = '2', updated_at = now()
WHERE category = 'scraping' AND setting_key = 'madlan_pages';