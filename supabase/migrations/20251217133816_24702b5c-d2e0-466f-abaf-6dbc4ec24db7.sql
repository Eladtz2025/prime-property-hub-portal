-- Add show_on_website column to property_images table
ALTER TABLE property_images 
ADD COLUMN IF NOT EXISTS show_on_website BOOLEAN DEFAULT true;