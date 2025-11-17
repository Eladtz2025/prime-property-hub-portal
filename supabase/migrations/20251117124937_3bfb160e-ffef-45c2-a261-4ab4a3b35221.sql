-- Add mamad (safe room) column to properties table
ALTER TABLE properties 
ADD COLUMN mamad boolean DEFAULT false;