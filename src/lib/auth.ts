import { supabase } from '@/integrations/supabase/client';
import type { UserProfile, Permission, UserRole } from '@/types/auth';
import { logger } from '@/utils/logger';

// Auth helpers
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};


export const signUp = async (email: string, password: string, fullName?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  });
  return { data, error };
};

// Profile helpers
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  // Fetch profile data
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (profileError) {
    logger.error('Error fetching user profile:', profileError, 'getUserProfile');
    return null;
  }
  
  // Fetch user role from user_roles table
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (roleError) {
    logger.error('Error fetching user role:', roleError, 'getUserProfile');
  }
  
  // Combine profile with role
  const profile: UserProfile = {
    ...profileData,
    role: roleData?.role || 'viewer' // Default to viewer if no role found
  };
  
  return profile;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
};

// Permission helpers
export const getUserPermissions = async (role: UserRole) => {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .eq('role', role);
  
  return { data, error };
};

export const hasPermission = (permissions: Permission[], resource: string, action: string): boolean => {
  return permissions.some(p => p.resource === resource && p.action === action);
};