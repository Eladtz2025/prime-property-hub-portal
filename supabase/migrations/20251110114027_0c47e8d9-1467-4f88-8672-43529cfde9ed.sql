-- Drop the general "Admins can manage all properties" policy that includes DELETE
DROP POLICY IF EXISTS "Admins can manage all properties" ON properties;

-- Create separate policies for each operation

-- Policy for SELECT (includes manager)
CREATE POLICY "Admins and managers can view all properties"
ON properties FOR SELECT
USING (
  get_current_user_role() = ANY (ARRAY['admin', 'super_admin', 'manager'])
);

-- Policy for INSERT (includes manager)
CREATE POLICY "Admins and managers can create properties"
ON properties FOR INSERT
WITH CHECK (
  get_current_user_role() = ANY (ARRAY['admin', 'super_admin', 'manager'])
);

-- Policy for UPDATE (includes manager)
CREATE POLICY "Admins and managers can update all properties"
ON properties FOR UPDATE
USING (
  get_current_user_role() = ANY (ARRAY['admin', 'super_admin', 'manager'])
);

-- Policy for DELETE (excludes manager - only admin and super_admin!)
CREATE POLICY "Only admins can delete all properties"
ON properties FOR DELETE
USING (
  get_current_user_role() = ANY (ARRAY['admin', 'super_admin'])
);

-- Update the property owners delete policy to exclude manager
DROP POLICY IF EXISTS "Property owners can delete their properties" ON properties;

CREATE POLICY "Property owners and admins can delete properties"
ON properties FOR DELETE
USING (
  (
    EXISTS (
      SELECT 1 FROM property_owners po
      WHERE po.property_id = properties.id 
      AND po.owner_id = auth.uid()
    )
  )
  OR 
  (
    get_current_user_role() = ANY (ARRAY['admin', 'super_admin'])
  )
);