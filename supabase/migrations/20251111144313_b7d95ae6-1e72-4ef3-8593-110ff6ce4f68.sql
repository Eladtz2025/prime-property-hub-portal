-- Update Tali's role in user_roles to manager
UPDATE user_roles 
SET role = 'manager'::app_role
WHERE user_id = '30300ca7-6c59-41e4-99dd-ef59ea3ea349'
AND role = 'viewer'::app_role;