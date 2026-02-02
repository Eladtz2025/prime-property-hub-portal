-- Update batch_size to 50 for availability checks
UPDATE scout_settings 
SET setting_value = '50' 
WHERE category = 'availability' AND setting_key = 'batch_size';