import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, PenSquare, CalendarDays, Users2, FileText, Send, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { SocialAccountSetup } from './SocialAccountSetup';
import { SocialPostComposer } from './SocialPostComposer';
import { SocialPostsList } from './SocialPostsList';
import { FacebookGroupsManager } from './FacebookGroupsManager';
import { SocialTemplatesManager } from './SocialTemplatesManager';
import { useSocialAccounts, useSocialPosts } from '@/hooks/useSocialPosts';

export const SocialDashboard: React.FC = () => {
  const { data: accounts } = useSocialAccounts();
  const { data: allPosts } = useSocialPosts('all', 'all');
  const hasConnectedAccount = accounts && accounts.some(a => a.is_active);

  const publishedCount = allPosts?.filter(p => p.status === 'published').length || 0;
  const scheduledCount = allPosts?.filter(p => p.status === 'scheduled').length || 0;
  const draftCount = allPosts?.filter(p => p.status === 'draft').length || 0;
  const failedCount = allPosts?.filter(p => p.status === 'failed').length || 0;

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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{publishedCount}</p>
              <p className="text-xs text-muted-foreground">פורסמו</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{scheduledCount}</p>
              <p className="text-xs text-muted-foreground">מתוזמנים</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{draftCount}</p>
              <p className="text-xs text-muted-foreground">טיוטות</p>
            </div>
          </CardContent>
        </Card>
        {failedCount > 0 ? (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{failedCount}</p>
                <p className="text-xs text-muted-foreground">נכשלו</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Send className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(allPosts?.length) || 0}</p>
                <p className="text-xs text-muted-foreground">סה"כ</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
