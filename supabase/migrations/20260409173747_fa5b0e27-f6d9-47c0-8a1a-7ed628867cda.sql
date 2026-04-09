
-- =============================================
-- PRIORITY 2: Tighten overly permissive RLS
-- =============================================

-- ============ GROUP A: Service tables ============

-- 1. backfill_progress: remove authenticated INSERT, restrict UPDATE to admin/manager
DROP POLICY IF EXISTS "Authenticated users can insert backfill progress" ON public.backfill_progress;
DROP POLICY IF EXISTS "Authenticated users can update backfill progress" ON public.backfill_progress;

CREATE POLICY "Admins can update backfill progress"
  ON public.backfill_progress FOR UPDATE TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- 2. personal_scout_matches: restrict writes to service_role only
DROP POLICY IF EXISTS "Authenticated users can insert personal scout matches" ON public.personal_scout_matches;
DROP POLICY IF EXISTS "Authenticated users can update personal scout matches" ON public.personal_scout_matches;

CREATE POLICY "Service role can manage personal_scout_matches"
  ON public.personal_scout_matches FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 3. personal_scout_runs: restrict writes to service_role only
DROP POLICY IF EXISTS "Authenticated users can insert personal scout runs" ON public.personal_scout_runs;
DROP POLICY IF EXISTS "Authenticated users can update personal scout runs" ON public.personal_scout_runs;

CREATE POLICY "Service role can manage personal_scout_runs"
  ON public.personal_scout_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 4. duplicate_alerts: INSERT service_role, UPDATE admin/manager
DROP POLICY IF EXISTS "Authenticated users can insert duplicate alerts" ON public.duplicate_alerts;
DROP POLICY IF EXISTS "Authenticated users can update duplicate alerts" ON public.duplicate_alerts;

CREATE POLICY "Service role can insert duplicate_alerts"
  ON public.duplicate_alerts FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Admins can update duplicate_alerts"
  ON public.duplicate_alerts FOR UPDATE TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- ============ GROUP B: Admin UI tables ============

-- 5. auto_publish_queues: restrict to admin/manager
DROP POLICY IF EXISTS "Authenticated users can manage queues" ON public.auto_publish_queues;

CREATE POLICY "Authenticated can view auto_publish_queues"
  ON public.auto_publish_queues FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage auto_publish_queues"
  ON public.auto_publish_queues FOR ALL TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'super_admin', 'manager'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- 6. auto_publish_items: restrict to admin/manager
DROP POLICY IF EXISTS "Authenticated users can manage items" ON public.auto_publish_items;

CREATE POLICY "Authenticated can view auto_publish_items"
  ON public.auto_publish_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage auto_publish_items"
  ON public.auto_publish_items FOR ALL TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'super_admin', 'manager'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- 7. auto_publish_log: writes service_role only, read authenticated
DROP POLICY IF EXISTS "Authenticated users can view logs" ON public.auto_publish_log;

CREATE POLICY "Authenticated can view auto_publish_log"
  ON public.auto_publish_log FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role can manage auto_publish_log"
  ON public.auto_publish_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 8. site_issues: restrict to admin/manager
DROP POLICY IF EXISTS "Authenticated users can insert site issues" ON public.site_issues;
DROP POLICY IF EXISTS "Authenticated users can update site issues" ON public.site_issues;
DROP POLICY IF EXISTS "Authenticated users can delete site issues" ON public.site_issues;

CREATE POLICY "Admins can manage site_issues"
  ON public.site_issues FOR ALL TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'super_admin', 'manager'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'super_admin', 'manager'));

-- 9. brokers: restrict to admin/manager
DROP POLICY IF EXISTS "Authenticated users can insert brokers" ON public.brokers;
DROP POLICY IF EXISTS "Authenticated users can update brokers" ON public.brokers;
DROP POLICY IF EXISTS "Authenticated users can delete brokers" ON public.brokers;

CREATE POLICY "Admins can manage brokers"
  ON public.brokers FOR ALL TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'super_admin', 'manager'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'super_admin', 'manager'));
