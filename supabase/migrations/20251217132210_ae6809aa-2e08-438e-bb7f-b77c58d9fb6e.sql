-- Update existing video files to have correct media_type
UPDATE property_images 
SET media_type = 'video' 
WHERE media_type IS DISTINCT FROM 'video'
  AND (
    LOWER(image_url) LIKE '%.mp4' 
    OR LOWER(image_url) LIKE '%.mov' 
    OR LOWER(image_url) LIKE '%.webm'
    OR LOWER(image_url) LIKE '%.avi'
    OR LOWER(image_url) LIKE '%.mkv'
  );