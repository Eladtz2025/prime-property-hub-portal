-- Create storage bucket for financial documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('financial-documents', 'financial-documents', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/heic']);

-- Create policies for financial documents storage
CREATE POLICY "Users can upload their own financial documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'financial-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own financial documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'financial-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own financial documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'financial-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own financial documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'financial-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);