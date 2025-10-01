import React, { useState } from 'react';
import { UserManagement as UserManagementComponent } from '@/components/UserManagement';
import { PropertyInvitationManager } from '@/components/PropertyInvitationManager';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">ניהול משתמשים והזמנות</h1>
          <p className="text-muted-foreground">
            נהל משתמשים, הרשאות והזמנות בעלי נכסים במערכת
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              משתמשים
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-2">
              <UserPlus className="h-4 w-4" />
              הזמנות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UserManagementComponent />
          </TabsContent>

          <TabsContent value="invitations" className="mt-6">
            <PropertyInvitationManager />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};