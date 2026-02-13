import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Copy, CheckCircle, Clock, AlertTriangle, Layers } from 'lucide-react';

interface DedupSummary {
  duplicates_found?: number;
  groups_created?: number;
  batches?: number;
  skipped?: number;
  total_active?: number;
  recent_batches?: { batch: number; processed: number; duplicates: number; groups: number; timestamp: string }[];
}

export const DeduplicationStatus: React.FC = () => {
  // Dedup run history from backfill_progress
  const { data: runs } = useQuery({
    queryKey: ['dedup-run-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backfill_progress')
        .select('id, task_name, status, processed_items, successful_items, failed_items, total_items, started_at, completed_at, summary_data')
        .eq('task_name', 'dedup-scan')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  // Live stats from scouted_properties
  const { data: liveStats } = useQuery({
    queryKey: ['dedup-live-stats'],
    queryFn: async () => {
      const [losersRes, uncheckedRes] = await Promise.all([
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).eq('is_primary_listing', false).not('duplicate_group_id', 'is', null),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).is('dedup_checked_at', null),
      ]);
      return {
        losers: losersRes.count ?? 0,
        unchecked: uncheckedRes.count ?? 0,
      };
    },
    refetchInterval: 15000,
  });

  const lastRun = runs?.[0];
  const lastSummary = lastRun?.summary_data as unknown as DedupSummary | null;

  const formatDuration = (started: string, completed: string | null) => {
    if (!completed) return 'רץ...';
    const secs = Math.round((new Date(completed).getTime() - new Date(started).getTime()) / 1000);
    return secs < 60 ? `${secs} שניות` : `${Math.round(secs / 60)} דקות`;
  };

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">כפילויות (losers)</p>
          <p className="text-xl font-bold text-purple-600">{liveStats?.losers ?? '—'}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">ממתינים לבדיקה</p>
          <p className="text-xl font-bold text-orange-600">{liveStats?.unchecked ?? '—'}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">ריצה אחרונה</p>
          <p className="text-xl font-bold">{lastRun?.successful_items ?? '—'}</p>
          <p className="text-[10px] text-muted-foreground">כפילויות נמצאו</p>
        </CardContent></Card>
      </div>

      {/* Last run details */}
      {lastRun && lastSummary && (
        <Card>
          <CardContent className="p-3 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">ריצה אחרונה</p>
              <Badge className={lastRun.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'}>
                {lastRun.status === 'completed' ? 'הושלם' : lastRun.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div><span className="font-medium text-foreground">{lastRun.processed_items?.toLocaleString('he-IL')}</span> נבדקו</div>
              <div><span className="font-medium text-foreground">{lastRun.successful_items?.toLocaleString('he-IL')}</span> כפילויות</div>
              <div><span className="font-medium text-foreground">{lastSummary.skipped ?? 0}</span> דולגו</div>
              <div><span className="font-medium text-foreground">{lastSummary.batches ?? 0}</span> באצ׳ים</div>
            </div>
            {lastRun.started_at && (
              <p className="text-[10px] text-muted-foreground">
                {format(new Date(lastRun.started_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                {lastRun.completed_at && ` — ${formatDuration(lastRun.started_at, lastRun.completed_at)}`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Run history table */}
      {runs && runs.length > 0 ? (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="h-9">
                <TableHead className="py-2 text-xs">תאריך</TableHead>
                <TableHead className="py-2 text-xs">סטטוס</TableHead>
                <TableHead className="py-2 text-xs">נבדקו</TableHead>
                <TableHead className="py-2 text-xs">כפילויות</TableHead>
                <TableHead className="py-2 text-xs">משך</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map(run => (
                <TableRow key={run.id} className="h-9">
                  <TableCell className="py-1.5 text-xs">
                    {run.started_at ? format(new Date(run.started_at), 'dd/MM HH:mm', { locale: he }) : '—'}
                  </TableCell>
                  <TableCell className="py-1.5">
                    {run.status === 'completed'
                      ? <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />הושלם</Badge>
                      : run.status === 'running'
                      ? <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]"><Clock className="h-3 w-3 mr-1" />רץ</Badge>
                      : <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-[10px]"><AlertTriangle className="h-3 w-3 mr-1" />{run.status}</Badge>
                    }
                  </TableCell>
                  <TableCell className="py-1.5 text-xs">{run.processed_items?.toLocaleString('he-IL') ?? '—'}</TableCell>
                  <TableCell className="py-1.5 text-xs font-medium">{run.successful_items?.toLocaleString('he-IL') ?? '—'}</TableCell>
                  <TableCell className="py-1.5 text-xs text-muted-foreground">
                    {run.started_at && run.completed_at ? formatDuration(run.started_at, run.completed_at) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground text-sm">אין ריצות כפילויות</div>
      )}
    </div>
  );
};
