-- Enable Homeless scout configurations
UPDATE scout_configs 
SET is_active = true 
WHERE source = 'homeless';