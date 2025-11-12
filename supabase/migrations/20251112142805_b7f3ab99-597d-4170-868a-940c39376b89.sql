-- Add owner_email column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS owner_email text;