-- Add municipal tax and building committee fee columns to properties table
ALTER TABLE properties 
ADD COLUMN municipal_tax numeric,
ADD COLUMN building_committee_fee numeric;