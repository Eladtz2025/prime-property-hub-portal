import { Permission } from '@/types/auth';

/**
 * Check if user has permission to view phone numbers
 * Only Super Admins can view phone numbers
 */
export const canViewPhoneNumbers = (permissions: Permission[]): boolean => {
  // Debug logging to see what permissions user has
  console.log('Checking permissions for phone numbers:', permissions);
  
  // Only super_admin role should be able to view phone numbers
  const hasContactsPermission = permissions.some(p => p.resource === 'contacts' && p.action === 'read');
  console.log('Has contacts permission:', hasContactsPermission);
  
  return hasContactsPermission;
};

/**
 * Format phone number with masking for users without permission
 */
export const formatPhoneDisplay = (phone: string | undefined, canView: boolean): string => {
  if (!phone || !canView) {
    return '***-***-****';
  }
  return phone;
};