-- Add UPDATE policy for admins and managers to update contact leads
CREATE POLICY "Admins can update contact leads"
ON contact_leads
FOR UPDATE
TO authenticated
USING (
  get_current_user_role() = ANY(ARRAY['admin', 'super_admin', 'manager'])
)
WITH CHECK (
  get_current_user_role() = ANY(ARRAY['admin', 'super_admin', 'manager'])
);