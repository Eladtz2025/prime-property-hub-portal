UPDATE public.scout_runs 
SET status = 'completed', completed_at = now() 
WHERE id = '90509a34-0ebf-48fd-a5ec-5e13dcde194e' AND status = 'running';