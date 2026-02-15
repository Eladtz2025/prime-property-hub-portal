ALTER TABLE availability_check_runs 
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;