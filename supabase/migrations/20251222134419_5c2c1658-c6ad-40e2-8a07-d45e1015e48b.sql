-- Add RLS policy for deleting contact leads
CREATE POLICY "Admins can delete contact leads"
ON contact_leads
FOR DELETE
TO authenticated
USING (
  get_current_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text, 'manager'::text])
);