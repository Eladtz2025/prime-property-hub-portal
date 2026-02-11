ALTER TABLE availability_check_runs 
ADD COLUMN IF NOT EXISTS run_details jsonb DEFAULT '[]'::jsonb;