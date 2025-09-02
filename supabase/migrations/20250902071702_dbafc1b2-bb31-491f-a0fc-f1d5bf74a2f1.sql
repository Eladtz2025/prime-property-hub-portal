-- Fix critical security issue: Restrict permissions table access to admin/super_admin only
DROP POLICY IF EXISTS "Anyone can read permissions" ON permissions;

CREATE POLICY "Only admins can read permissions" ON permissions
FOR SELECT USING (
  get_current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text])
);