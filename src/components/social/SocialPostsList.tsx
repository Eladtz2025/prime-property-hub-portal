import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, RefreshCw, Trash2, Pencil, Send } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useSocialPosts, useDeleteSocialPost, useUpdateSocialPost, usePublishPost } from '@/hooks/useSocialPosts';

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'טיוטא', variant: 'outline' },
  scheduled: { label: 'מתוזמן', variant: 'secondary' },
  publishing: { label: 'בתהליך', variant: 'default' },
  published: { label: 'פורסם', variant: 'default' },
  failed: { label: 'נכשל', variant: 'destructive' },
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base">היסטוריית פוסטים</CardTitle>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28 text-xs h-8">
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
              <SelectTrigger className="w-28 text-xs h-8">
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
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">טוען...</div>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">אין פוסטים עדיין</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">תוכן</TableHead>
                <TableHead className="text-xs w-20">פלטפורמה</TableHead>
                <TableHead className="text-xs w-20">סטטוס</TableHead>
                <TableHead className="text-xs w-24">תאריך</TableHead>
                <TableHead className="text-xs w-20">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map(post => {
                const statusInfo = STATUS_BADGE[post.status] || STATUS_BADGE.draft;
                const imgs = (post.image_urls as string[]) || [];
                return (
                  <TableRow key={post.id}>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        {imgs[0] && (
                          <img src={imgs[0]} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                        )}
                        <span className="line-clamp-2">{post.content_text?.slice(0, 60) || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{PLATFORM_LABEL[post.platform] || post.platform}</TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant} className="text-[10px]">
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {post.published_at
                        ? format(new Date(post.published_at), 'dd/MM HH:mm')
                        : post.scheduled_at
                          ? format(new Date(post.scheduled_at), 'dd/MM HH:mm')
                          : format(new Date(post.created_at), 'dd/MM HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {post.status === 'failed' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => publishMutation.mutate(post.id)}
                            title="שלח מחדש"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                        {post.status === 'scheduled' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => updateMutation.mutate({ id: post.id, status: 'draft', scheduled_at: null })}
                            title="בטל תזמון"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                        {post.external_post_url && (
                          <a href={post.external_post_url} target="_blank" rel="noopener">
                            <Button size="icon" variant="ghost" className="h-6 w-6" title="צפה בפוסט">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </a>
                        )}
                        {['draft', 'failed'].includes(post.status) && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive"
                            onClick={() => deleteMutation.mutate(post.id)}
                            title="מחק"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {posts && posts.some(p => p.status === 'failed') && (
          <div className="mt-3 p-2 bg-destructive/10 rounded text-xs text-destructive">
            {posts.filter(p => p.status === 'failed').length} פוסטים נכשלו — לחץ על כפתור הרענון כדי לנסות שוב
          </div>
        )}
      </CardContent>
    </Card>
  );
};
