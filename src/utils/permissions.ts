import { Permission } from '@/types/auth';

/**
 * Check if user has permission to view phone numbers
 * Only Super Admins can view phone numbers
 */
export const canViewPhoneNumbers = (permissions: Permission[]): boolean => {
  return permissions.some(p => p.resource === 'contacts' && p.action === 'read');
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