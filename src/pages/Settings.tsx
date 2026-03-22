import React, { useState } from 'react';
import { UserSettings } from '@/components/UserSettings';
import { UserManagement as UserManagementComponent } from '@/components/UserManagement';
import { PropertyInvitationManager } from '@/components/PropertyInvitationManager';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, UserPlus, ChevronDown, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Settings: React.FC = () => {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === 'super_admin';
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    settings: false,
    users: false,
    invitations: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">הגדרות</h1>
          <p className="text-muted-foreground">
            נהל את ההגדרות האישיות שלך{isSuperAdmin ? ' ואת המשתמשים במערכת' : ''}
          </p>
        </div>

        {/* Personal Settings */}
        {(
          <Collapsible open={openSections.settings} onOpenChange={() => toggleSection('settings')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SettingsIcon className="h-5 w-5" />
                      <CardTitle>הגדרות אישיות</CardTitle>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      openSections.settings && "rotate-180"
                    )} />
                  </div>
                  <CardDescription>
                    עדכן את הפרטים האישיים שלך
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <UserSettings />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Super Admin Only Sections */}
        {isSuperAdmin && (
          <>
            <Separator className="my-8" />
            
            {/* User Management Section */}
            <Collapsible open={openSections.users} onOpenChange={() => toggleSection('users')}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <CardTitle>ניהול משתמשים</CardTitle>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        openSections.users && "rotate-180"
                      )} />
                    </div>
                    <CardDescription>
                      נהל משתמשים, תפקידים והרשאות במערכת
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <UserManagementComponent />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Property Invitations Section */}
            <Collapsible open={openSections.invitations} onOpenChange={() => toggleSection('invitations')}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        <CardTitle>הזמנות בעלי נכסים</CardTitle>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        openSections.invitations && "rotate-180"
                      )} />
                    </div>
                    <CardDescription>
                      הזמן בעלי נכסים חדשים והקצה להם נכסים לניהול
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <PropertyInvitationManager />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
};
