-- Cleanup redundant old policies on backup_history
DROP POLICY IF EXISTS "Admins can insert backup_history" ON public.backup_history;
DROP POLICY IF EXISTS "Admins can update backup_history" ON public.backup_history;
DROP POLICY IF EXISTS "Admins can view backup_history" ON public.backup_history;

-- Cleanup redundant old policies on monitoring_logs
DROP POLICY IF EXISTS "Admins can insert monitoring_logs" ON public.monitoring_logs;
DROP POLICY IF EXISTS "Admins can view monitoring_logs" ON public.monitoring_logs;

-- Cleanup redundant old policy on pipeline_runs
DROP POLICY IF EXISTS "Admins can manage all pipeline_runs" ON public.pipeline_runs;

-- Cleanup redundant old policy on scout_runs
DROP POLICY IF EXISTS "Admins can view scout runs" ON public.scout_runs;