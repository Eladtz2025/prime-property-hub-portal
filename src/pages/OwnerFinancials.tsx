import React from 'react';
import { FinancialDashboard } from '@/components/FinancialDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const OwnerFinancials: React.FC = () => {
  return (
    <ProtectedRoute requiredRole="property_owner" requireApproval={false}>
      <FinancialDashboard />
    </ProtectedRoute>
  );
};