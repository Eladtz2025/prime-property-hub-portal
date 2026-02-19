
-- Add website and coupon_code columns to professionals_list
ALTER TABLE public.professionals_list 
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS coupon_code text;

-- Add public SELECT policy for anon users (for the shared page)
CREATE POLICY "Anyone can view professionals for shared page"
ON public.professionals_list
FOR SELECT
USING (true);
