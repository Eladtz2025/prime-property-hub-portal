INSERT INTO permissions (role, resource, action) VALUES
  ('viewer', 'users', 'read'),
  ('viewer', 'brokerage_forms', 'read'),
  ('viewer', 'contacts', 'read'),
  ('viewer', 'dashboard', 'read')
ON CONFLICT (role, resource, action) DO NOTHING;