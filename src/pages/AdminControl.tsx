import React from 'react';
import { AdminControlDashboard } from '@/components/AdminControlDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const AdminControl: React.FC = () => {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminControlDashboard />
    </ProtectedRoute>
  );
};