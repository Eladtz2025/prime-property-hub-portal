
ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS rooms_range text,
  ADD COLUMN IF NOT EXISTS size_range text,
  ADD COLUMN IF NOT EXISTS units_count integer,
  ADD COLUMN IF NOT EXISTS has_storage boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS project_status text DEFAULT 'under_construction';
