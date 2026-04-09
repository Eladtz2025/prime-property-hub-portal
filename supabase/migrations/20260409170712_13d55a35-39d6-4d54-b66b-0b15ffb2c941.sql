-- 1. debug_scrape_samples: remove public ALL, add service_role only
DROP POLICY IF EXISTS "Service role has full access to debug_scrape_samples" ON public.debug_scrape_samples;
CREATE POLICY "Service role full access debug_scrape_samples" ON public.debug_scrape_samples FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. pipeline_runs: remove public INSERT, add service_role
DROP POLICY IF EXISTS "System can insert pipeline_runs" ON public.pipeline_runs;
CREATE POLICY "Service role can manage pipeline_runs" ON public.pipeline_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. backup_history: remove public INSERT, add service_role + authenticated SELECT
DROP POLICY IF EXISTS "System can insert backup_history" ON public.backup_history;
CREATE POLICY "Service role can manage backup_history" ON public.backup_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can view backup_history" ON public.backup_history FOR SELECT TO authenticated USING (true);

-- 4. monitoring_logs: remove public INSERT, add service_role + authenticated SELECT
DROP POLICY IF EXISTS "System can insert monitoring_logs" ON public.monitoring_logs;
CREATE POLICY "Service role can manage monitoring_logs" ON public.monitoring_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can view monitoring_logs" ON public.monitoring_logs FOR SELECT TO authenticated USING (true);

-- 5. scout_runs: remove public INSERT+UPDATE, add service_role (authenticated SELECT already exists)
DROP POLICY IF EXISTS "System can insert scout runs" ON public.scout_runs;
DROP POLICY IF EXISTS "System can update scout runs" ON public.scout_runs;
CREATE POLICY "Service role can manage scout_runs" ON public.scout_runs FOR ALL TO service_role USING (true) WITH CHECK (true);