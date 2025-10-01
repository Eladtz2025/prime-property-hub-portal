-- Add monthly_rent column to properties table
ALTER TABLE properties 
ADD COLUMN monthly_rent numeric;

COMMENT ON COLUMN properties.monthly_rent IS 'Expected or current monthly rent for the property';