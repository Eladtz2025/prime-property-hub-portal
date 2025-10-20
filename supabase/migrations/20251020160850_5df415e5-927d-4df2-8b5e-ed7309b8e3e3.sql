-- Create a new storage bucket for original images (without watermark)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images-original', 'property-images-original', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the original images bucket
CREATE POLICY "Authenticated users can view original images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images-original' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload original images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images-original' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update original images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-images-original' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete original images"
ON storage.objects FOR DELETE
USING (bucket_id = 'property-images-original' AND auth.role() = 'authenticated');