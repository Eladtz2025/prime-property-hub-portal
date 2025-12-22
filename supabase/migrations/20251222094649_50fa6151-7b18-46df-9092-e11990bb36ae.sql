-- Drop and recreate the view to include broker fields
DROP VIEW IF EXISTS user_profiles_with_roles;

CREATE VIEW user_profiles_with_roles AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.broker_license_number,
  p.id_number,
  p.address,
  p.is_approved,
  p.created_at,
  p.updated_at,
  p.last_login,
  COALESCE(ur.role, 'viewer'::app_role) as role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id;