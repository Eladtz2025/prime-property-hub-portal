import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Download, Clock, CheckCircle, XCircle, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'ממתין', color: 'bg-blue-100 text-blue-700', icon: <Clock className="h-3 w-3" /> },
  publishing: { label: 'בתהליך', color: 'bg-yellow-100 text-yellow-700', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  published: { label: 'פורסם', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
  failed: { label: 'נכשל', color: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
  skipped: { label: 'דולג', color: 'bg-gray-100 text-gray-500', icon: <XCircle className="h-3 w-3" /> },
};

function useGroupQueue() {
  return useQuery({
    queryKey: ['group-publish-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_group_publish_queue')
        .select('*')
        .order('scheduled_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
}

export const GroupQueueManager: React.FC = () => {
  const { data: items, isLoading } = useGroupQueue();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyAndOpen = async (item: any) => {
    try {
      await navigator.clipboard.writeText(item.content_text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
      window.open(item.group_url, '_blank');
      toast({ title: 'הטקסט הועתק! הקבוצה נפתחה בטאב חדש' });
    } catch {
      toast({ title: 'שגיאה בהעתקה', variant: 'destructive' });
    }
  };

  const handleDownloadExtension = () => {
    fetch('/ct-market-publisher.zip')
      .then(res => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'ct-market-publisher.zip';
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => toast({ title: 'שגיאה בהורדה', variant: 'destructive' }));
  };

  const pending = items?.filter(i => i.status === 'pending').length || 0;
  const published = items?.filter(i => i.status === 'published').length || 0;
  const failed = items?.filter(i => i.status === 'failed').length || 0;

  return (
    <Card className="border-border/40">
      <CardContent className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">תור קבוצות פייסבוק</span>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleDownloadExtension}>
            <Download className="h-3 w-3" />
            הורד תוסף כרום
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-2 text-xs">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">{pending} ממתינים</Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700">{published} פורסמו</Badge>
          {failed > 0 && <Badge variant="outline" className="bg-red-50 text-red-700">{failed} נכשלו</Badge>}
        </div>

        {/* Extension install instructions */}
        <div className="bg-muted/50 rounded p-2 text-[10px] text-muted-foreground space-y-0.5">
          <strong>התקנת התוסף:</strong>
          <ol className="list-decimal list-inside space-y-0.5 mr-2">
            <li>הורד את הקובץ ZIP</li>
            <li>פתח <code className="bg-muted px-1 rounded">chrome://extensions</code></li>
            <li>הפעל "מצב מפתח" (Developer mode)</li>
            <li>לחץ "Load unpacked" ובחר את התיקייה שחולצה</li>
          </ol>
        </div>

        {/* Queue items */}
        {isLoading ? (
          <div className="text-center text-xs text-muted-foreground py-4">טוען...</div>
        ) : !items?.length ? (
          <div className="text-center text-xs text-muted-foreground py-4">אין פוסטים בתור</div>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {items.map(item => {
              const status = STATUS_MAP[item.status] || STATUS_MAP.pending;
              return (
                <div key={item.id} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge className={cn('text-[9px] h-5 gap-1', status.color)}>
                      {status.icon}
                      {status.label}
                    </Badge>
                    <span className="truncate font-medium">{item.group_name}</span>
                    <span className="text-[9px] text-muted-foreground shrink-0">
                      {new Date(item.scheduled_at).toLocaleString('he-IL', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {(item.status === 'pending' || item.status === 'failed') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2 gap-1"
                        onClick={() => handleCopyAndOpen(item)}
                      >
                        {copiedId === item.id ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        {copiedId === item.id ? 'הועתק!' : 'העתק ופתח'}
                      </Button>
                    )}
                    {item.status === 'published' && item.published_at && (
                      <span className="text-[9px] text-green-600">
                        {new Date(item.published_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {item.status === 'failed' && item.error_message && (
                      <span className="text-[9px] text-red-500 truncate max-w-[100px]" title={item.error_message}>
                        {item.error_message}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
