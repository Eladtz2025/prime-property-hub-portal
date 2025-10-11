export type UserRole = 'super_admin' | 'admin' | 'manager' | 'viewer' | 'property_owner';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: UserRole; // This is now fetched from user_roles table
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Permission {
  id: string;
  role: UserRole;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  created_at: string;
}