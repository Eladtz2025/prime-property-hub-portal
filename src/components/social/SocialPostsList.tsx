import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, RefreshCw, Trash2, Clock, CheckCircle, XCircle, FileText, Send } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useSocialPosts, useDeleteSocialPost, useUpdateSocialPost, usePublishPost } from '@/hooks/useSocialPosts';
import { ConfirmDialog } from './ConfirmDialog';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  draft: { label: 'טיוטא', variant: 'outline', icon: <FileText className="h-3 w-3" /> },
  scheduled: { label: 'מתוזמן', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  publishing: { label: 'בתהליך', variant: 'default', icon: <Send className="h-3 w-3" /> },
  published: { label: 'פורסם', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  failed: { label: 'נכשל', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
};

const PLATFORM_LABEL: Record<string, string> = {
  facebook_page: 'פייסבוק',
  instagram: 'אינסטגרם',
  facebook_group: 'קבוצה',
};

export const SocialPostsList: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const { data: posts, isLoading } = useSocialPosts(statusFilter, platformFilter);
  const deleteMutation = useDeleteSocialPost();
  const updateMutation = useUpdateSocialPost();
  const publishMutation = usePublishPost();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [retryConfirm, setRetryConfirm] = useState<string | null>(null);

  return (
    <>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-24 text-xs h-7">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="draft">טיוטות</SelectItem>
                <SelectItem value="scheduled">מתוזמנים</SelectItem>
                <SelectItem value="published">פורסמו</SelectItem>
                <SelectItem value="failed">נכשלו</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-24 text-xs h-7">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="facebook_page">פייסבוק</SelectItem>
                <SelectItem value="instagram">אינסטגרם</SelectItem>
                <SelectItem value="facebook_group">קבוצות</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">טוען...</div>
          ) : !posts || posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">אין פוסטים עדיין</p>
              <p className="text-xs mt-1">צור פוסט חדש בטאב "פוסט חדש"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => {
                const statusInfo = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
                const imgs = (post.image_urls as string[]) || [];
                return (
                  <div key={post.id} className="flex gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
                    {/* Thumbnail */}
                    {imgs[0] ? (
                      <img src={imgs[0]} alt="" className="w-16 h-16 rounded-md object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-muted shrink-0 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm line-clamp-2 leading-snug">{post.content_text?.slice(0, 80) || '—'}</p>
                        <Badge variant={statusInfo.variant} className="text-[10px] shrink-0 gap-1">
                          {statusInfo.icon}
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        <span>{PLATFORM_LABEL[post.platform] || post.platform}</span>
                        <span>•</span>
                        <span>
                          {post.published_at
                            ? format(new Date(post.published_at), 'dd/MM HH:mm')
                            : post.scheduled_at
                              ? format(new Date(post.scheduled_at), 'dd/MM HH:mm')
                              : format(new Date(post.created_at), 'dd/MM HH:mm')}
                        </span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 mt-2">
                        {post.status === 'failed' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setRetryConfirm(post.id)}>
                            <RefreshCw className="h-3 w-3" />
                            שלח שוב
                          </Button>
                        )}
                        {post.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => updateMutation.mutate({ id: post.id, status: 'draft', scheduled_at: null })}
                          >
                            <RefreshCw className="h-3 w-3" />
                            בטל תזמון
                          </Button>
                        )}
                        {post.external_post_url && (
                          <a href={post.external_post_url} target="_blank" rel="noopener">
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                              <ExternalLink className="h-3 w-3" />
                              צפה
                            </Button>
                          </a>
                        )}
                        {['draft', 'failed'].includes(post.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm(post.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            מחק
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {posts && posts.some(p => p.status === 'failed') && (
            <div className="mt-3 p-3 bg-destructive/10 rounded-lg text-xs text-destructive flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0" />
              {posts.filter(p => p.status === 'failed').length} פוסטים נכשלו — לחץ על "שלח שוב" כדי לנסות שנית
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title="מחיקת פוסט"
        description="האם אתה בטוח שברצונך למחוק פוסט זה? פעולה זו אינה ניתנת לביטול."
        confirmLabel="מחק"
        variant="destructive"
        onConfirm={() => {
          if (deleteConfirm) deleteMutation.mutate(deleteConfirm);
          setDeleteConfirm(null);
        }}
      />

      {/* Retry Confirmation */}
      <ConfirmDialog
        open={!!retryConfirm}
        onOpenChange={() => setRetryConfirm(null)}
        title="שליחה מחדש"
        description="הפוסט ישלח שוב לפייסבוק/אינסטגרם. האם להמשיך?"
        confirmLabel="שלח שוב"
        onConfirm={() => {
          if (retryConfirm) publishMutation.mutate(retryConfirm);
          setRetryConfirm(null);
        }}
      />
    </>
  );
};
