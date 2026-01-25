-- Update Madlan configs to use simplified settings
UPDATE scout_configs 
SET start_page = 1, 
    page_delay_seconds = 5
WHERE source = 'madlan';