import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireApproval?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requireApproval = true 
}) => {
  const { isAuthenticated, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">טוען פרופיל...</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  if (requireApproval && !profile.is_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2 text-yellow-600 dark:text-yellow-400">
              ממתין לאישור
            </h2>
            <p className="text-muted-foreground">
              החשבון שלך ממתין לאישור מנהל המערכת. תוכל להיכנס למערכת לאחר האישור.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (requiredRole) {
    const roleHierarchy: Record<UserRole, number> = {
      'viewer': 1,
      'manager': 2,
      'admin': 3,
      'super_admin': 4
    };

    const userLevel = roleHierarchy[profile.role];
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">
                אין הרשאה
              </h2>
              <p className="text-muted-foreground">
                אין לך הרשאה לגשת לעמוד זה. פנה למנהל המערכת.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};