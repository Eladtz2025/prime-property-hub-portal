import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Facebook, Instagram } from 'lucide-react';
import { useAutoPublishLog } from '@/hooks/useAutoPublish';

export const AutoPublishLog: React.FC = () => {
  const { data: logs, isLoading } = useAutoPublishLog();

  if (isLoading) return <p className="text-xs text-muted-foreground px-1">טוען...</p>;
  if (!logs || logs.length === 0) return <p className="text-xs text-muted-foreground px-1">אין היסטוריה עדיין</p>;

  return (
    <div className="space-y-0.5">
      {logs.map((log, i) => {
        const queueName = (log as Record<string, unknown>).auto_publish_queues
          ? ((log as Record<string, unknown>).auto_publish_queues as Record<string, unknown>).name as string
          : 'תור';
        const platforms = (log.platforms as string[]) || [];

        return (
          <div key={log.id} className="flex items-center gap-2 group">
            {/* Timeline dot */}
            <div className="flex flex-col items-center shrink-0">
              {log.status === 'published' ? (
                <div className="w-2 h-2 rounded-full bg-green-500" />
              ) : log.status === 'failed' ? (
                <div className="w-2 h-2 rounded-full bg-destructive" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              )}
              {i < logs.length - 1 && <div className="w-px h-5 bg-border mt-0.5" />}
            </div>

            {/* Content */}
            <div className="flex items-center gap-2 flex-1 py-1 text-[11px] min-w-0">
              <span className="font-medium truncate flex-1">{queueName}</span>
              <div className="flex items-center gap-1 shrink-0">
                {platforms.map(p => (
                  <span key={p}>
                    {p === 'facebook_page' ? (
                      <Facebook className="h-2.5 w-2.5 text-blue-500" />
                    ) : (
                      <Instagram className="h-2.5 w-2.5 text-pink-500" />
                    )}
                  </span>
                ))}
              </div>
              <span className="text-muted-foreground shrink-0">
                {new Date(log.published_at).toLocaleDateString('he-IL')}{' '}
                {new Date(log.published_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {log.error_message && (
                <Badge variant="destructive" className="text-[9px] px-1 h-4">
                  שגיאה
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
