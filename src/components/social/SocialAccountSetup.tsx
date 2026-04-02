import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useSocialAccounts, useSaveSocialAccount } from '@/hooks/useSocialPosts';
import { useToast } from '@/hooks/use-toast';

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

  const handleVerifyAndSave = async () => {
    if (!accessToken || !pageId) {
      toast({ title: 'יש להזין Page ID ו-Access Token', variant: 'destructive' });
      return;
    }

    setVerifying(true);
    try {
      // Verify token by fetching page info
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=name,id&access_token=${accessToken}`
      );
      const data = await res.json();

      if (data.error) {
        toast({ title: 'טוקן לא תקין', description: data.error.message, variant: 'destructive' });
        return;
      }

      // Debug token to get real expiry from Facebook
      const tokenRes = await fetch(
        `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`
      );
      const tokenData = await tokenRes.json();

      if (tokenData.data?.error) {
        toast({ title: 'טוקן לא תקין', description: tokenData.data.error.message, variant: 'destructive' });
        return;
      }

      // Warn if short-lived token (expires in less than 24 hours)
      const tokenExpiresAt = tokenData.data?.expires_at;
      if (tokenExpiresAt && tokenExpiresAt > 0 && (tokenExpiresAt * 1000 - Date.now()) < 24 * 60 * 60 * 1000) {
        toast({ title: 'טוקן Short-Lived', description: 'יש ליצור Long-Lived Token דרך Graph API Explorer', variant: 'destructive' });
        return;
      }

      // Use real expiry from Facebook, fallback to 60 days
      const realExpiry = tokenData.data?.data_access_expires_at
        ? new Date(tokenData.data.data_access_expires_at * 1000).toISOString()
        : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

      // Save Facebook account
      await saveMutation.mutateAsync({
        platform: 'facebook',
        page_id: pageId,
        page_name: data.name,
        access_token: accessToken,
        ig_user_id: igUserId || undefined,
        token_expires_at: realExpiry,
      });

      // If IG user ID provided, save Instagram account too
      if (igUserId) {
        await saveMutation.mutateAsync({
          platform: 'instagram',
          page_id: pageId,
          page_name: data.name + ' (Instagram)',
          access_token: accessToken,
          ig_user_id: igUserId,
          token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      setAccessToken('');
      toast({ title: 'חשבון Meta חובר בהצלחה! 🎉' });
    } catch (e) {
      toast({ title: 'שגיאה באימות', description: e instanceof Error ? e.message : 'Unknown', variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  };

  const getDaysLeft = (expiresAt?: string) => {
    if (!expiresAt) return null;
    return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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
                {getDaysLeft(fbAccount.token_expires_at ?? undefined) !== null && (
                  <Badge variant={getDaysLeft(fbAccount.token_expires_at ?? undefined)! < 7 ? 'destructive' : 'secondary'} className="text-[10px]">
                    {getDaysLeft(fbAccount.token_expires_at ?? undefined)} ימים
                  </Badge>
                )}
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
              <span className="text-xs text-muted-foreground">{igAccount.page_name}</span>
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
                  צרו Long-Lived Page Access Token ב-{' '}
                  <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener" className="text-primary underline">
                    Graph API Explorer <ExternalLink className="h-3 w-3 inline" />
                  </a>
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
              <Label className="text-xs">Page Access Token (Long-Lived)</Label>
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
            disabled={verifying || !pageId || !accessToken}
            className="w-full"
          >
            {verifying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                מאמת...
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
