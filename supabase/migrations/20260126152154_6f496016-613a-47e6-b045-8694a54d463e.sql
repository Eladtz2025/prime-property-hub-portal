-- Add RLS policy for creators to view their own tokens
CREATE POLICY "Creators can view their tokens"
ON public.legal_form_tokens
FOR SELECT
TO authenticated
USING (created_by = auth.uid());