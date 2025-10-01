-- Allow anyone to view invitations by token (needed for invitation acceptance flow)
CREATE POLICY "Anyone can view invitations by token"
ON property_invitations
FOR SELECT
USING (true);