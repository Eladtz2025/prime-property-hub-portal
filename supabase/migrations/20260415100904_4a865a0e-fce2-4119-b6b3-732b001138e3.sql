
-- Step 1: Reassign all 22 properties from Tali to Elad
UPDATE properties
SET assigned_user_id = 'bfd1625c-7bb5-424f-8969-966cbbdd00ef'
WHERE assigned_user_id = '30300ca7-6c59-41e4-99dd-ef59ea3ea349';

-- Step 2: Remove Tali's super_admin role
DELETE FROM user_roles
WHERE user_id = '30300ca7-6c59-41e4-99dd-ef59ea3ea349';

-- Step 3: Deactivate Tali's profile
UPDATE profiles
SET is_approved = false
WHERE id = '30300ca7-6c59-41e4-99dd-ef59ea3ea349';
