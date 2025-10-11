-- Add show_management_badge column to properties table
ALTER TABLE properties 
ADD COLUMN show_management_badge boolean DEFAULT true;