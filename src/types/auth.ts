export type UserRole = 'super_admin' | 'admin' | 'manager' | 'viewer' | 'property_owner';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  role?: string; // comes from user_profiles_with_roles view
  // Broker-specific fields
  broker_license_number?: string;
  id_number?: string;
  address?: string;
  green_api_instance_id?: string;
  green_api_token?: string;
}

export interface Permission {
  id: string;
  role: UserRole;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  created_at: string;
}
