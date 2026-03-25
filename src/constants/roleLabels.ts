import { UserRole } from '@/types/auth';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'מנהל עליון',
  admin: 'מנהל',
  manager: 'מנהל תיקים',
  viewer: 'צופה',
  property_owner: 'בעל נכס',
};

export const getRoleLabel = (role?: string): string => {
  if (!role) return 'צופה';
  return ROLE_LABELS[role as UserRole] || role;
};
