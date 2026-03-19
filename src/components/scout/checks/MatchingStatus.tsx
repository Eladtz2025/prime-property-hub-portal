import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const MatchingStatus: React.FC = () => {
  const { data: runs } = useQuery({
    queryKey: ['matching-runs-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_runs')
        .select('*')
        .eq('source', 'matching')
        .order('started_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const lastRun = runs?.[0];
  const isRunning = lastRun?.status === 'running';

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">ריצה אחרונה</p>
          <p className="text-sm font-bold">
            {isRunning ? <span className="text-blue-600 flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />רץ</span>
              : lastRun?.completed_at ? format(new Date(lastRun.completed_at), 'dd/MM HH:mm', { locale: he }) : '—'}
          </p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">לידים שנבדקו</p>
          <p className="text-xl font-bold">{lastRun?.leads_completed ?? '—'}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">התאמות נמצאו</p>
          <p className="text-xl font-bold text-green-600">{lastRun?.total_matches ?? '—'}</p>
        </CardContent></Card>
      </div>

      {/* History */}
      {runs && runs.length > 0 ? (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="h-9">
                <TableHead className="py-2 text-xs">תאריך</TableHead>
                <TableHead className="py-2 text-xs">סטטוס</TableHead>
                <TableHead className="py-2 text-xs">לידים</TableHead>
                <TableHead className="py-2 text-xs">התאמות</TableHead>
                <TableHead className="py-2 text-xs">שגיאה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map(run => (
                <TableRow key={run.id} className="h-9">
                  <TableCell className="py-1.5 text-xs">
                    {run.started_at ? format(new Date(run.started_at), 'dd/MM HH:mm', { locale: he }) : '—'}
                  </TableCell>
                  <TableCell className="py-1.5">
                    {run.status === 'completed' && <Badge className="bg-green-600 text-white text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />הושלם</Badge>}
                    {run.status === 'running' && <Badge className="bg-blue-600 text-white text-[10px]"><Loader2 className="h-3 w-3 mr-1 animate-spin" />רץ</Badge>}
                    {run.status === 'failed' && <Badge className="bg-red-600 text-white text-[10px]"><XCircle className="h-3 w-3 mr-1" />נכשל</Badge>}
                    {!['completed', 'running', 'failed'].includes(run.status || '') && <Badge variant="outline" className="text-[10px]">{run.status}</Badge>}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs">{run.leads_completed ?? 0}/{run.leads_count ?? 0}</TableCell>
                  <TableCell className="py-1.5 text-xs font-medium text-green-600">{run.total_matches ?? 0}</TableCell>
                  <TableCell className="py-1.5 text-[10px] text-red-500 truncate max-w-[150px]">{run.error_message || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground text-sm">אין היסטוריית התאמות</div>
      )}
    </div>
  );
};
