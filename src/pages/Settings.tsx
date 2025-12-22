import React from 'react';
import { UserSettings } from '@/components/UserSettings';
import { UserManagement as UserManagementComponent } from '@/components/UserManagement';
import { PropertyInvitationManager } from '@/components/PropertyInvitationManager';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users, UserPlus } from 'lucide-react';

export const Settings: React.FC = () => {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === 'super_admin';

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">הגדרות</h1>
          <p className="text-muted-foreground">
            נהל את ההגדרות האישיות שלך{isSuperAdmin ? ' ואת המשתמשים במערכת' : ''}
          </p>
        </div>

        {/* Personal Settings - only for non-super_admin users */}
        {!isSuperAdmin && <UserSettings />}

        {/* Super Admin Only Sections */}
        {isSuperAdmin && (
          <>
            <Separator className="my-8" />
            
            {/* User Management Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  ניהול משתמשים
                </CardTitle>
                <CardDescription>
                  נהל משתמשים, תפקידים והרשאות במערכת
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagementComponent />
              </CardContent>
            </Card>

            {/* Property Invitations Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  הזמנות בעלי נכסים
                </CardTitle>
                <CardDescription>
                  הזמן בעלי נכסים חדשים והקצה להם נכסים לניהול
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PropertyInvitationManager />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
};
