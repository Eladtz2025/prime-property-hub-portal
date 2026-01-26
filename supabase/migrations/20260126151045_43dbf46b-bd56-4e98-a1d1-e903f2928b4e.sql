-- Allow authenticated users to create tokens (for link sharing)
CREATE POLICY "Authenticated users can create tokens"
ON public.legal_form_tokens
FOR INSERT
TO authenticated
WITH CHECK (
  created_by IS NULL OR created_by = auth.uid()
);