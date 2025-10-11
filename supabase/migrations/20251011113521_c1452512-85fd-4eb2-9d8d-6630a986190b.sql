-- Enable RLS on property_images if not already enabled
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Admins can manage property images" ON property_images;
DROP POLICY IF EXISTS "Anyone can view property images" ON property_images;

-- Allow anyone to view property images (for public property pages)
CREATE POLICY "Anyone can view property images"
ON property_images
FOR SELECT
USING (true);

-- Allow admins to insert property images
CREATE POLICY "Admins can insert property images"
ON property_images
FOR INSERT
WITH CHECK (
  get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

-- Allow admins to update property images
CREATE POLICY "Admins can update property images"
ON property_images
FOR UPDATE
USING (
  get_current_user_role() IN ('admin', 'super_admin', 'manager')
);

-- Allow admins to delete property images
CREATE POLICY "Admins can delete property images"
ON property_images
FOR DELETE
USING (
  get_current_user_role() IN ('admin', 'super_admin', 'manager')
);