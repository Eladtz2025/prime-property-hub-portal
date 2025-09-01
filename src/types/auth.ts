export type UserRole = 'super_admin' | 'admin' | 'manager' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Permission {
  id: string;
  role: UserRole;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  created_at: string;
}