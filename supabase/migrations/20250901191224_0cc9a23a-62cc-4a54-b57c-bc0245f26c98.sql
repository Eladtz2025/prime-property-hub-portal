-- Create security definer function to get current user role (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer')),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer')),
  resource TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(role, resource, action)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Create profiles policies using security definer function
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Admin policies for profiles using security definer function
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  public.get_current_user_role() IN ('admin', 'super_admin')
);

CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
  public.get_current_user_role() IN ('admin', 'super_admin')
);

CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (
  public.get_current_user_role() IN ('admin', 'super_admin')
);

CREATE POLICY "Super admins can delete profiles" ON profiles FOR DELETE USING (
  public.get_current_user_role() = 'super_admin'
);

-- Permissions policies
CREATE POLICY "Anyone can read permissions" ON permissions FOR SELECT TO authenticated;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default permissions
INSERT INTO permissions (role, resource, action) VALUES
-- Super Admin permissions (all)
('super_admin', 'users', 'create'),
('super_admin', 'users', 'read'),
('super_admin', 'users', 'update'),
('super_admin', 'users', 'delete'),
('super_admin', 'properties', 'create'),
('super_admin', 'properties', 'read'),
('super_admin', 'properties', 'update'),
('super_admin', 'properties', 'delete'),
('super_admin', 'reports', 'create'),
('super_admin', 'reports', 'read'),
('super_admin', 'reports', 'update'),
('super_admin', 'reports', 'delete'),
('super_admin', 'alerts', 'create'),
('super_admin', 'alerts', 'read'),
('super_admin', 'alerts', 'update'),
('super_admin', 'alerts', 'delete'),

-- Admin permissions (most things)
('admin', 'users', 'read'),
('admin', 'users', 'update'),
('admin', 'properties', 'create'),
('admin', 'properties', 'read'),
('admin', 'properties', 'update'),
('admin', 'properties', 'delete'),
('admin', 'reports', 'read'),
('admin', 'reports', 'create'),
('admin', 'alerts', 'create'),
('admin', 'alerts', 'read'),
('admin', 'alerts', 'update'),
('admin', 'alerts', 'delete'),

-- Manager permissions (properties and limited reports)
('manager', 'properties', 'create'),
('manager', 'properties', 'read'),
('manager', 'properties', 'update'),
('manager', 'reports', 'read'),
('manager', 'alerts', 'read'),
('manager', 'alerts', 'update'),

-- Viewer permissions (read only)
('viewer', 'properties', 'read'),
('viewer', 'reports', 'read'),
('viewer', 'alerts', 'read')

ON CONFLICT (role, resource, action) DO NOTHING;

COMMENT ON TABLE profiles IS 'User profiles with roles and permissions';
COMMENT ON TABLE permissions IS 'Role-based permissions for different resources';
COMMENT ON FUNCTION handle_new_user() IS 'Automatically create profile when user signs up';