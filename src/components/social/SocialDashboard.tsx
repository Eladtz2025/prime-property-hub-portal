import React, { useState } from 'react';
import { Settings, CheckCircle, Clock, FileText, Send, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SocialAccountSetup } from './SocialAccountSetup';
import { SocialPostComposer } from './SocialPostComposer';
import { SocialPostsList } from './SocialPostsList';
import { SocialToolsPanel } from './SocialToolsPanel';
import { useSocialAccounts, useSocialPosts } from '@/hooks/useSocialPosts';

export const SocialDashboard: React.FC = () => {
  const { data: accounts } = useSocialAccounts();
  const { data: allPosts } = useSocialPosts('all', 'all');
  const hasConnectedAccount = accounts && accounts.some(a => a.is_active);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const publishedCount = allPosts?.filter(p => p.status === 'published').length || 0;
  const scheduledCount = allPosts?.filter(p => p.status === 'scheduled').length || 0;
  const draftCount = allPosts?.filter(p => p.status === 'draft').length || 0;
  const failedCount = allPosts?.filter(p => p.status === 'failed').length || 0;
  const totalCount = allPosts?.length || 0;

  const expiringToken = accounts?.find(a => {
    if (!a.token_expires_at) return false;
    const daysLeft = (new Date(a.token_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft < 7 && daysLeft > 0;
  });

  return (
    <div className="space-y-3" dir="rtl">
      {expiringToken && (
        <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-2.5 flex items-center gap-2 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-secondary shrink-0" />
          <span>
            הטוקן של <strong>{expiringToken.page_name}</strong> עומד לפוג. 
            <Button variant="link" size="sm" className="text-xs h-auto p-0 mr-1" onClick={() => setSettingsOpen(true)}>
              חדש עכשיו
            </Button>
          </span>
        </div>
      )}

      {/* Compact status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            {publishedCount} פורסמו
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-blue-500" />
            {scheduledCount} מתוזמנים
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {draftCount} טיוטות
          </span>
          {failedCount > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                {failedCount} נכשלו
              </span>
            </>
          )}
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <Send className="h-3 w-3" />
            {totalCount} סה"כ
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setSettingsOpen(true)}
          title="הגדרות חיבור"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <SocialPostComposer />
      <SocialPostsList />
      <SocialToolsPanel />

      {/* Settings Sheet */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto" dir="rtl">
          <SheetHeader>
            <SheetTitle className="text-right">הגדרות חיבור</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <SocialAccountSetup />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
