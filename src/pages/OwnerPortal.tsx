import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OwnerDashboard } from '@/components/OwnerDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const OwnerPortal: React.FC = () => {
  return (
    <ProtectedRoute requiredRole="property_owner">
      <OwnerDashboard />
    </ProtectedRoute>
  );
};