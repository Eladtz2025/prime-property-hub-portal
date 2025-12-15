-- Add neighborhood field to properties table for privacy
ALTER TABLE properties ADD COLUMN neighborhood text;

-- Add comment to explain the field
COMMENT ON COLUMN properties.neighborhood IS 'Area/neighborhood for public display instead of exact address';