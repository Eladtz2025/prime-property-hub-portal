-- Add media_type column to property_images table
ALTER TABLE property_images 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';

-- Add check constraint for valid media types
ALTER TABLE property_images 
ADD CONSTRAINT property_images_media_type_check 
CHECK (media_type IN ('image', 'video'));