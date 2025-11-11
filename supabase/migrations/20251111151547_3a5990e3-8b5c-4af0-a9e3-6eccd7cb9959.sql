-- Drop the old restrictive policy that only allows admins to read permissions
DROP POLICY "Only admins can read permissions" ON permissions;

-- Create new policy that allows all authenticated users to read permissions
-- This is safe because:
-- 1. The permissions table contains role-based rules (not user-specific secrets)
-- 2. Users can only READ, not modify permissions
-- 3. The actual authorization checks happen server-side
-- 4. This allows the UI to display appropriate buttons based on user roles
CREATE POLICY "Authenticated users can read all permissions"
ON permissions
FOR SELECT
TO authenticated
USING (true);