import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, PenSquare, CalendarDays, Users2, FileText } from 'lucide-react';
import { SocialAccountSetup } from './SocialAccountSetup';
import { SocialPostComposer } from './SocialPostComposer';
import { SocialPostsList } from './SocialPostsList';
import { FacebookGroupsManager } from './FacebookGroupsManager';
import { SocialTemplatesManager } from './SocialTemplatesManager';
import { useSocialAccounts } from '@/hooks/useSocialPosts';
import { Badge } from '@/components/ui/badge';

export const SocialDashboard: React.FC = () => {
  const { data: accounts } = useSocialAccounts();
  const hasConnectedAccount = accounts && accounts.some(a => a.is_active);

  // Check for expiring tokens
  const expiringToken = accounts?.find(a => {
    if (!a.token_expires_at) return false;
    const daysLeft = (new Date(a.token_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft < 7 && daysLeft > 0;
  });

  return (
    <div className="space-y-4" dir="rtl">
      {expiringToken && (
        <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-3 flex items-center gap-2 text-sm">
          <span>⚠️</span>
          <span>
            הטוקן של <strong>{expiringToken.page_name}</strong> עומד לפוג תוקף. 
            עבור להגדרות כדי לחדש אותו.
          </span>
        </div>
      )}

      <Tabs defaultValue={hasConnectedAccount ? 'compose' : 'setup'} className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-5 text-[10px] sm:text-xs">
          <TabsTrigger value="setup" className="flex items-center gap-1">
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">הגדרות</span>
          </TabsTrigger>
          <TabsTrigger value="compose" className="flex items-center gap-1">
            <PenSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">פוסט חדש</span>
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">היסטוריה</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-1">
            <Users2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">קבוצות</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">תבניות</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="mt-4">
          <SocialAccountSetup />
        </TabsContent>
        <TabsContent value="compose" className="mt-4">
          <SocialPostComposer />
        </TabsContent>
        <TabsContent value="posts" className="mt-4">
          <SocialPostsList />
        </TabsContent>
        <TabsContent value="groups" className="mt-4">
          <FacebookGroupsManager />
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <SocialTemplatesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
