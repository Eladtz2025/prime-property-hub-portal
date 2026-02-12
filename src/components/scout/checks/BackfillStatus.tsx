import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CheckCircle, XCircle, Loader2, Play, Square } from 'lucide-react';
import { useBackfillProgress } from '@/hooks/useBackfillProgress';

export const BackfillStatus: React.FC = () => {
  const { isRunning, progress, percentComplete, start, stop, isStarting, isStopping } = useBackfillProgress();

  const { data: history } = useQuery({
    queryKey: ['backfill-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backfill_progress')
        .select('*')
        .eq('task_name', 'data_completion')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: isRunning ? 5000 : 30000,
  });

  return (
    <div className="space-y-3">
      {/* Current status + action */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">השלמת נתונים (Backfill)</p>
              <p className="text-xs text-muted-foreground">
                {isRunning ? 'רץ כעת...' : progress?.status === 'completed' ? 'הושלם' : progress?.status || 'לא הופעל'}
              </p>
            </div>
            {isRunning ? (
              <Button size="sm" variant="destructive" className="h-8 text-xs gap-1" onClick={stop} disabled={isStopping}>
                {isStopping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Square className="h-3 w-3" />}
                עצור
              </Button>
            ) : (
              <Button size="sm" className="h-8 text-xs gap-1" onClick={start} disabled={isStarting}>
                {isStarting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                הפעל
              </Button>
            )}
          </div>
          {isRunning && progress && (
            <div className="space-y-1">
              <Progress value={percentComplete} className="h-2" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{progress.processed_items ?? 0}/{progress.total_items ?? '?'}</span>
                <span>הצלחות: {progress.successful_items ?? 0} | כשלונות: {progress.failed_items ?? 0}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {history && history.length > 0 ? (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="h-9">
                <TableHead className="py-2 text-xs">תאריך</TableHead>
                <TableHead className="py-2 text-xs">סטטוס</TableHead>
                <TableHead className="py-2 text-xs">עובדו</TableHead>
                <TableHead className="py-2 text-xs">הצלחות</TableHead>
                <TableHead className="py-2 text-xs">כשלונות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map(item => (
                <TableRow key={item.id} className="h-9">
                  <TableCell className="py-1.5 text-xs">
                    {item.started_at ? format(new Date(item.started_at), 'dd/MM HH:mm', { locale: he }) : '—'}
                  </TableCell>
                  <TableCell className="py-1.5">
                    {item.status === 'completed' && <Badge className="bg-green-600 text-white text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />הושלם</Badge>}
                    {item.status === 'running' && <Badge className="bg-blue-600 text-white text-[10px]"><Loader2 className="h-3 w-3 mr-1 animate-spin" />רץ</Badge>}
                    {item.status === 'failed' && <Badge className="bg-red-600 text-white text-[10px]"><XCircle className="h-3 w-3 mr-1" />נכשל</Badge>}
                    {item.status === 'stopped' && <Badge variant="outline" className="text-[10px]">נעצר</Badge>}
                    {!['completed', 'running', 'failed', 'stopped'].includes(item.status || '') && <Badge variant="outline" className="text-[10px]">{item.status}</Badge>}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs">{item.processed_items ?? 0}/{item.total_items ?? '?'}</TableCell>
                  <TableCell className="py-1.5 text-xs text-green-600">{item.successful_items ?? 0}</TableCell>
                  <TableCell className="py-1.5 text-xs text-red-500">{item.failed_items ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground text-sm">אין היסטוריית Backfill</div>
      )}
    </div>
  );
};
