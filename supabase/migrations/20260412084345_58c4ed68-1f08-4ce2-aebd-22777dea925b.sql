CREATE POLICY "Admins can view scout runs"
ON public.scout_runs
FOR SELECT
TO authenticated
USING (public.get_current_user_role() IN ('super_admin', 'admin', 'manager'));