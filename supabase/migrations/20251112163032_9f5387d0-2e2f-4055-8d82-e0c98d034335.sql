-- Add missing brokerage_forms permissions
INSERT INTO permissions (role, resource, action) VALUES
  -- Super Admin permissions
  ('super_admin', 'brokerage_forms', 'create'),
  ('super_admin', 'brokerage_forms', 'read'),
  ('super_admin', 'brokerage_forms', 'update'),
  ('super_admin', 'brokerage_forms', 'delete'),
  
  -- Admin permissions
  ('admin', 'brokerage_forms', 'create'),
  ('admin', 'brokerage_forms', 'read'),
  ('admin', 'brokerage_forms', 'update'),
  ('admin', 'brokerage_forms', 'delete'),
  
  -- Manager permissions
  ('manager', 'brokerage_forms', 'create'),
  ('manager', 'brokerage_forms', 'read'),
  ('manager', 'brokerage_forms', 'update')
ON CONFLICT (role, resource, action) DO NOTHING;