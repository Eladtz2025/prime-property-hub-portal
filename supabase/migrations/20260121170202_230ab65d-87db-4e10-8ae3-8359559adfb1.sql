-- Drop the old constraint and add one that includes 'stopped'
ALTER TABLE scout_runs DROP CONSTRAINT scout_runs_status_check;

ALTER TABLE scout_runs ADD CONSTRAINT scout_runs_status_check 
CHECK (status = ANY (ARRAY['running'::text, 'completed'::text, 'failed'::text, 'stopped'::text]));