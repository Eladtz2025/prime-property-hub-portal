-- Change rooms column to numeric to support decimal values (e.g., 2.5)
ALTER TABLE properties ALTER COLUMN rooms TYPE numeric;

-- Add RLS policy to allow property owners to delete their properties
CREATE POLICY "Property owners can delete their properties"
ON properties
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM property_owners po
    WHERE po.property_id = properties.id
    AND po.owner_id = auth.uid()
  )
  OR get_current_user_role() IN ('admin', 'super_admin', 'manager')
);