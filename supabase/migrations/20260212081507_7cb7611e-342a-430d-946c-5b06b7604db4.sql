ALTER TABLE scout_configs
ADD COLUMN owner_type_filter TEXT DEFAULT NULL
CHECK (owner_type_filter IS NULL OR owner_type_filter IN ('private', 'broker'));