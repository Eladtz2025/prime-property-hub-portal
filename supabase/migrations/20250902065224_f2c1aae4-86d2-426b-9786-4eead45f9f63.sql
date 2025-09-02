-- Update the first user to be super admin and approved
-- This will set the user who just signed up as the super admin
UPDATE public.profiles 
SET 
  role = 'super_admin',
  is_approved = true,
  updated_at = now()
WHERE id = (
  SELECT id FROM public.profiles 
  ORDER BY created_at ASC 
  LIMIT 1
);