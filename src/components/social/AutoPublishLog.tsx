import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAutoPublishLog } from '@/hooks/useAutoPublish';

export const AutoPublishLog: React.FC = () => {
  const { data: logs, isLoading } = useAutoPublishLog();

  if (isLoading) return <p className="text-xs text-muted-foreground px-1">טוען...</p>;
  if (!logs || logs.length === 0) return <p className="text-xs text-muted-foreground px-1">אין היסטוריה עדיין</p>;

  return (
    <div className="space-y-1">
      {logs.map(log => (
        <div key={log.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/30 text-[11px]">
          {log.status === 'published' ? (
            <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
          ) : log.status === 'failed' ? (
            <XCircle className="h-3 w-3 text-destructive shrink-0" />
          ) : (
            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          <span className="flex-1 truncate">
            {(log as Record<string, unknown>).auto_publish_queues
              ? ((log as Record<string, unknown>).auto_publish_queues as Record<string, unknown>).name as string
              : 'תור'}
          </span>
          <span className="text-muted-foreground shrink-0">
            {new Date(log.published_at).toLocaleDateString('he-IL')}{' '}
            {new Date(log.published_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {log.error_message && (
            <Badge variant="destructive" className="text-[9px] px-1">
              שגיאה
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
};
