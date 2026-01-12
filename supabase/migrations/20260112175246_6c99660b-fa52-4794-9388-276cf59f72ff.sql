-- Remove old constraint on scouted_properties
ALTER TABLE scouted_properties DROP CONSTRAINT IF EXISTS scouted_properties_source_check;

-- Add new constraint with homeless included
ALTER TABLE scouted_properties ADD CONSTRAINT scouted_properties_source_check 
  CHECK (source = ANY (ARRAY['yad2'::text, 'madlan'::text, 'homeless'::text, 'other'::text]));

-- Remove old constraint on scout_configs if exists
ALTER TABLE scout_configs DROP CONSTRAINT IF EXISTS scout_configs_source_check;

-- Add new constraint with all sources
ALTER TABLE scout_configs ADD CONSTRAINT scout_configs_source_check 
  CHECK (source = ANY (ARRAY['yad2'::text, 'yad2_private'::text, 'madlan'::text, 'homeless'::text, 'other'::text]));