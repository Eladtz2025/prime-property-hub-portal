-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON property_invitations;
DROP POLICY IF EXISTS "View invitations only with valid token" ON property_invitations;

-- Recreate with proper restrictions
CREATE POLICY "View invitations only with valid token"
ON property_invitations FOR SELECT
USING (
  invitation_token IS NOT NULL
  AND expires_at > now()
  AND used_at IS NULL
);