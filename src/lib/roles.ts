import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/types/auth';
import { logger } from '@/utils/logger';

/**
 * Get user roles from the user_roles table
 */
export const getUserRoles = async (userId: string): Promise<UserRole[]> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  
  if (error) {
    logger.error('Error fetching user roles:', error, 'getUserRoles');
    return [];
  }
  
  return data.map(r => r.role as UserRole);
};

/**
 * Get the highest priority role for a user
 */
export const getPrimaryRole = async (userId: string): Promise<UserRole> => {
  const roles = await getUserRoles(userId);
  
  const roleHierarchy: Record<UserRole, number> = {
    'super_admin': 5,
    'admin': 4,
    'manager': 3,
    'property_owner': 2,
    'viewer': 1
  };
  
  if (roles.length === 0) return 'viewer';
  
  return roles.reduce((highest, current) => {
    return roleHierarchy[current] > roleHierarchy[highest] ? current : highest;
  }, roles[0]);
};

/**
 * Check if user has a specific role
 */
export const hasRole = async (userId: string, role: UserRole): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle();
  
  if (error) {
    logger.error('Error checking user role:', error, 'hasRole');
    return false;
  }
  
  return !!data;
};

/**
 * Add a role to a user (admin only)
 */
export const addUserRole = async (userId: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role });
  
  if (error) {
    logger.error('Error adding user role:', error, 'addUserRole');
    return { success: false, error: error.message };
  }
  
  return { success: true };
};

/**
 * Remove a role from a user (admin only)
 */
export const removeUserRole = async (userId: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role);
  
  if (error) {
    logger.error('Error removing user role:', error, 'removeUserRole');
    return { success: false, error: error.message };
  }
  
  return { success: true };
};