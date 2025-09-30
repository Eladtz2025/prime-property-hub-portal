-- Add phone numbers to existing profiles for testing
UPDATE profiles SET phone = '0501234567' WHERE email LIKE '%admin%' OR role = 'admin';
UPDATE profiles SET phone = '0509876543' WHERE email LIKE '%manager%' OR role = 'manager';
UPDATE profiles SET phone = '0502345678' WHERE email NOT LIKE '%admin%' AND role != 'admin' AND role != 'manager' AND phone IS NULL;