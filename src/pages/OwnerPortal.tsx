import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OwnerDashboard } from '@/components/OwnerDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';

export const OwnerPortal: React.FC = () => {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === 'super_admin';

  return (
    <ProtectedRoute requiredRole="property_owner">
      {isSuperAdmin ? (
        <Layout>
          <OwnerDashboard />
        </Layout>
      ) : (
        <OwnerDashboard />
      )}
    </ProtectedRoute>
  );
};