-- Add phone field to profiles table
ALTER TABLE public.profiles ADD COLUMN phone TEXT;

-- Create index for better phone number lookups
CREATE INDEX idx_profiles_phone ON public.profiles(phone);

-- Update RLS policies to allow users to update their own phone
-- The existing policies already allow users to update their own profile