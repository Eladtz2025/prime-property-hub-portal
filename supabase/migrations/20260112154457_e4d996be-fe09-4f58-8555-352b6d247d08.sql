-- First, drop the existing constraint and add a new one that includes all sources
ALTER TABLE scout_configs DROP CONSTRAINT IF EXISTS scout_configs_source_check;

-- Add new constraint with all valid sources
ALTER TABLE scout_configs ADD CONSTRAINT scout_configs_source_check 
CHECK (source IN ('yad2', 'yad2_private', 'madlan', 'homeless', 'both', 'all'));