-- Update Elad's profile to super_admin with full permissions
UPDATE profiles 
SET 
  role = 'super_admin', 
  is_approved = true,
  updated_at = NOW()
WHERE email = 'eladtz@gmail.com';