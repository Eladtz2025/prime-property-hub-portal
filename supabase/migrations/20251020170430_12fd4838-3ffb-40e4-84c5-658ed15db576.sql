-- Upload logo to storage bucket (this is just a placeholder - actual file upload needs to be done manually or via edge function)
-- You need to manually upload the file public/images/city-market-logo.png to the property-images bucket

-- Verify bucket exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'property-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('property-images', 'property-images', true);
  END IF;
END $$;