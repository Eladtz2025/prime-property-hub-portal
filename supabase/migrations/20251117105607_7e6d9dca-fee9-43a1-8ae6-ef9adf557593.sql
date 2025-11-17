-- Add assigned_user_id column to properties table
ALTER TABLE properties 
ADD COLUMN assigned_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_properties_assigned_user_id ON properties(assigned_user_id);

-- Add comment
COMMENT ON COLUMN properties.assigned_user_id IS 'The user (agent) responsible for this property';