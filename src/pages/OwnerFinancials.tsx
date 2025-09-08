import React from 'react';
import { FinancialReports } from '@/components/FinancialReports';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const OwnerFinancials: React.FC = () => {
  return (
    <ProtectedRoute requiredRole="property_owner" requireApproval={false}>
      <FinancialReports />
    </ProtectedRoute>
  );
};