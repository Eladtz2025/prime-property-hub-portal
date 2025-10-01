import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OwnerDashboard } from '@/components/OwnerDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';

export const OwnerPortal: React.FC = () => {
  return (
    <ProtectedRoute requiredRole="property_owner">
      <Layout>
        <OwnerDashboard />
      </Layout>
    </ProtectedRoute>
  );
};