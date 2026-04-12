import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Clock, CheckCircle, XCircle, FileText, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useSocialPosts } from '@/hooks/useSocialPosts';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; className?: string }> = {
  draft: { label: 'טיוטא', variant: 'outline', icon: <FileText className="h-2.5 w-2.5" /> },
  scheduled: { label: 'מתוזמן', variant: 'secondary', icon: <Clock className="h-2.5 w-2.5" /> },
  publishing: { label: 'בתהליך', variant: 'default', icon: <Send className="h-2.5 w-2.5" /> },
  published: { label: 'פורסם', variant: 'default', icon: <CheckCircle className="h-2.5 w-2.5" /> },
  ready_to_copy: { label: 'מוכן', variant: 'outline', icon: <FileText className="h-2.5 w-2.5" />, className: 'border-orange-400 text-orange-600 bg-orange-50' },
  failed: { label: 'נכשל', variant: 'destructive', icon: <XCircle className="h-2.5 w-2.5" /> },
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

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-20 text-[10px] h-6">
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
          <SelectTrigger className="w-20 text-[10px] h-6">
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
        <div className="text-center py-3 text-muted-foreground text-[10px]">טוען...</div>
      ) : !posts || posts.length === 0 ? (
        <div className="text-center py-3 text-muted-foreground text-[10px]">אין פוסטים עדיין</div>
      ) : (
        <div className="divide-y divide-border">
          {posts.map(post => {
            const statusInfo = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
            return (
              <div key={post.id} className="flex items-center gap-2 py-1.5 px-2 text-xs hover:bg-accent/5 transition-colors">
                <Badge variant={statusInfo.variant} className={cn("text-[9px] px-1.5 py-0 h-4 shrink-0 gap-0.5", statusInfo.className)}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </Badge>
                <span className="truncate flex-1 text-[11px]">{post.content_text?.slice(0, 50) || '—'}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{PLATFORM_LABEL[post.platform] || post.platform}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {format(new Date(post.published_at || post.scheduled_at || post.created_at), 'dd/MM HH:mm')}
                </span>
                {post.external_post_url && (
                  <a href={post.external_post_url} target="_blank" rel="noopener">
                    <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
