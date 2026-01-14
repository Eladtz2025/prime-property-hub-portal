-- Update yad2_private configs to yad2 (they will scan all listings now)
UPDATE scout_configs 
SET source = 'yad2' 
WHERE source = 'yad2_private';

-- Temporarily disable homeless configs
UPDATE scout_configs 
SET is_active = false 
WHERE source = 'homeless';