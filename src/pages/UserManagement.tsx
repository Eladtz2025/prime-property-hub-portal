import React from 'react';
import { UserManagement as UserManagementComponent } from '@/components/UserManagement';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const UserManagement: React.FC = () => {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">ניהול משתמשים</h1>
          <p className="text-muted-foreground">
            נהל משתמשים, תפקידים והרשאות במערכת
          </p>
        </div>
        <UserManagementComponent />
      </div>
    </ProtectedRoute>
  );
};