import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useSocialAccounts, useSaveSocialAccount } from '@/hooks/useSocialPosts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const SocialAccountSetup: React.FC = () => {
  const { data: accounts, isLoading } = useSocialAccounts();
  const saveMutation = useSaveSocialAccount();
  const { toast } = useToast();

  const [pageId, setPageId] = useState('');
  const [igUserId, setIgUserId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const fbAccount = accounts?.find(a => a.platform === 'facebook');
  const igAccount = accounts?.find(a => a.platform === 'instagram');

  // Auto-fill from existing accounts
  React.useEffect(() => {
    if (fbAccount?.page_id && !pageId) setPageId(fbAccount.page_id);
    if (igAccount?.ig_user_id && !igUserId) setIgUserId(igAccount.ig_user_id);
  }, [fbAccount, igAccount]);

  const handleVerifyAndSave = async () => {
    const effectivePageId = pageId || fbAccount?.page_id;
    if (!accessToken || !effectivePageId) {
      toast({ title: 'יש להזין Page ID ו-Access Token', variant: 'destructive' });
      return;
    }

    setVerifying(true);
    try {
      // Call server-side edge function for token verification & exchange
      const { data, error } = await supabase.functions.invoke('verify-meta-connection', {
        body: {
          access_token: accessToken,
          page_id: effectivePageId,
          ig_user_id: igUserId || igAccount?.ig_user_id || null,
        },
      });

      if (error) {
        toast({ title: 'שגיאה בחיבור', description: error.message, variant: 'destructive' });
        return;
      }

      if (!data?.success) {
        toast({ title: 'שגיאה באימות', description: data?.error || 'Unknown error', variant: 'destructive' });
        return;
      }

      // Token verified and exchanged server-side — save the result
      const tokenExpiry = data.is_permanent
        ? null // permanent tokens don't have expiry
        : data.token_expires_at;

      // Save Facebook account
      await saveMutation.mutateAsync({
        platform: 'facebook',
        page_id: data.page_id,
        page_name: data.page_name,
        access_token: data.page_access_token,
        ig_user_id: data.ig_user_id || undefined,
        token_expires_at: tokenExpiry || undefined,
      });

      // If IG user ID verified, save Instagram account too
      if (data.ig_user_id) {
        await saveMutation.mutateAsync({
          platform: 'instagram',
          page_id: data.page_id,
          page_name: data.page_name + ' (Instagram)',
          access_token: data.page_access_token,
          ig_user_id: data.ig_user_id,
          token_expires_at: tokenExpiry || undefined,
        });
      }

      const statusMsg = data.is_permanent
        ? 'טוקן קבוע (ללא פקיעה)'
        : data.token_expires_at
          ? `פג תוקף: ${new Date(data.token_expires_at).toLocaleDateString('he-IL')}`
          : 'מחובר';

      const conversionMsg = data.token_type === 'USER'
        ? ' (הומר אוטומטית מ-User Token)'
        : '';

      setAccessToken('');
      toast({ title: `חשבון Meta חובר בהצלחה! 🎉`, description: `${statusMsg}${conversionMsg}` });
    } catch (e) {
      toast({ title: 'שגיאה באימות', description: e instanceof Error ? e.message : 'Unknown', variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  };

  const getStatusDisplay = (account: typeof fbAccount) => {
    if (!account?.is_active) return null;

    // If no token_expires_at, it's a permanent token
    if (!account.token_expires_at) {
      return <Badge variant="secondary" className="text-[10px]">קבוע ✓</Badge>;
    }

    const daysLeft = Math.ceil((new Date(account.token_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      return <Badge variant="destructive" className="text-[10px]">פג תוקף</Badge>;
    }
    
    return (
      <Badge variant={daysLeft < 7 ? 'destructive' : 'secondary'} className="text-[10px]">
        {daysLeft} ימים
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">סטטוס חיבור</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {fbAccount?.is_active ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span className="text-sm font-medium">פייסבוק דף עסקי</span>
            </div>
            {fbAccount?.is_active && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{fbAccount.page_name}</span>
                {getStatusDisplay(fbAccount)}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {igAccount?.is_active ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">אינסטגרם</span>
            </div>
            {igAccount?.is_active && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{igAccount.page_name}</span>
                {getStatusDisplay(igAccount)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>{fbAccount ? 'עדכון חיבור' : 'חיבור חשבון Meta'}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs"
            >
              {showGuide ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              מדריך
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showGuide && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
              <p className="font-medium">איך מחברים? (חד-פעמי)</p>
              <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
                <li>
                  היכנסו ל-{' '}
                  <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="text-primary underline">
                    developers.facebook.com
                  </a>{' '}
                  וצרו App חדש
                </li>
                <li>הוסיפו את ההרשאות: <code className="bg-muted px-1 rounded text-[11px]">pages_manage_posts</code>, <code className="bg-muted px-1 rounded text-[11px]">pages_read_engagement</code></li>
                <li>לאינסטגרם: הוסיפו גם <code className="bg-muted px-1 rounded text-[11px]">instagram_basic</code>, <code className="bg-muted px-1 rounded text-[11px]">instagram_content_publish</code></li>
                <li>
                  צרו Access Token (כל סוג) ב-{' '}
                  <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener" className="text-primary underline">
                    Graph API Explorer <ExternalLink className="h-3 w-3 inline" />
                  </a>
                  {' '} — המערכת תמיר אוטומטית ל-Page Token קבוע
                </li>
                <li>העתיקו את ה-Token, Page ID ו-IG User ID (אם רלוונטי) לטופס למטה</li>
              </ol>
            </div>
          )}

          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Facebook Page ID</Label>
              <Input
                value={pageId}
                onChange={e => setPageId(e.target.value)}
                placeholder={fbAccount?.page_id || 'לדוגמה: 123456789'}
                dir="ltr"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Instagram Business Account ID (אופציונלי)</Label>
              <Input
                value={igUserId}
                onChange={e => setIgUserId(e.target.value)}
                placeholder={igAccount?.ig_user_id || 'לדוגמה: 17841400...'}
                dir="ltr"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Access Token (User או Page — יומר אוטומטית)</Label>
              <Input
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
                placeholder="EAA..."
                type="password"
                dir="ltr"
                className="text-sm"
              />
            </div>
          </div>

          <Button
            onClick={handleVerifyAndSave}
            disabled={verifying || (!pageId && !fbAccount?.page_id) || !accessToken}
            className="w-full"
          >
            {verifying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                מאמת ומחבר...
              </>
            ) : (
              'בדוק חיבור ושמור'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
