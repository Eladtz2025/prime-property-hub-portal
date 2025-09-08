import React from 'react';
import { PropertyInvitationManager } from '@/components/PropertyInvitationManager';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const PropertyInvitations: React.FC = () => {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">הזמנות בעלי נכסים</h1>
          <p className="text-muted-foreground">
            הזמן בעלי נכסים חדשים והקצה להם נכסים לניהול
          </p>
        </div>
        <PropertyInvitationManager />
      </div>
    </ProtectedRoute>
  );
};