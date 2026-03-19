import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CheckCircle, Clock, AlertTriangle, ExternalLink, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

interface DedupSummary {
  duplicates_found?: number;
  groups_created?: number;
  batches?: number;
  skipped?: number;
  total_active?: number;
  recent_batches?: { batch: number; processed: number; duplicates: number; groups: number; timestamp: string }[];
}

interface DupProperty {
  id: string;
  address: string | null;
  city: string | null;
  price: number | null;
  rooms: number | null;
  floor: number | null;
  source_url: string | null;
  is_primary_listing: boolean | null;
  duplicate_group_id: string | null;
  source: string | null;
}

interface DupGroup {
  groupId: string;
  properties: DupProperty[];
  winner: DupProperty | null;
}

const GROUPS_PER_PAGE = 20;

const getSourceBadge = (source: string | null) => {
  if (!source) return null;
  const s = source.toLowerCase();
  if (s.includes('madlan')) return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]">Madlan</Badge>;
  if (s.includes('yad2')) return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-[10px]">Yad2</Badge>;
  if (s.includes('homeless')) return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-[10px]">Homeless</Badge>;
  return <Badge className="bg-muted text-muted-foreground text-[10px]">{source}</Badge>;
};

const priceDiffPercent = (price: number | null, winnerPrice: number | null): string | null => {
  if (!price || !winnerPrice || price === winnerPrice) return null;
  const diff = ((price - winnerPrice) / winnerPrice) * 100;
  return `${diff > 0 ? '+' : ''}${diff.toFixed(0)}%`;
};

export const DeduplicationStatus: React.FC = () => {
  const [page, setPage] = useState(1);

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
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).eq('is_primary_listing', false).not('duplicate_group_id', 'is', null).eq('is_active', true),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).is('dedup_checked_at', null).eq('is_active', true),
      ]);
      return {
        losers: losersRes.count ?? 0,
        unchecked: uncheckedRes.count ?? 0,
      };
    },
    refetchInterval: 15000,
  });

  // Duplicate groups detail
  const { data: dupProperties } = useQuery({
    queryKey: ['dedup-groups-detail'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scouted_properties')
        .select('id, address, city, price, rooms, floor, source_url, is_primary_listing, duplicate_group_id, source')
        .not('duplicate_group_id', 'is', null)
        .eq('is_active', true)
        .order('duplicate_group_id');
      if (error) throw error;
      return data as DupProperty[];
    },
    refetchInterval: 30000,
  });

  // Group by duplicate_group_id
  const groups: DupGroup[] = useMemo(() => {
    if (!dupProperties) return [];
    const map = new Map<string, DupProperty[]>();
    for (const p of dupProperties) {
      if (!p.duplicate_group_id) continue;
      const arr = map.get(p.duplicate_group_id) || [];
      arr.push(p);
      map.set(p.duplicate_group_id, arr);
    }
    return Array.from(map.entries())
      .map(([groupId, properties]) => ({
        groupId,
        properties,
        winner: properties.find(p => p.is_primary_listing) || properties[0],
      }))
      .sort((a, b) => b.properties.length - a.properties.length);
  }, [dupProperties]);

  const totalPages = Math.ceil(groups.length / GROUPS_PER_PAGE);
  const pagedGroups = groups.slice((page - 1) * GROUPS_PER_PAGE, page * GROUPS_PER_PAGE);

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
              <Badge className={lastRun.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : lastRun.status === 'stopped' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'}>
                {lastRun.status === 'completed' ? 'הושלם' : lastRun.status === 'stopped' ? 'נעצר' : lastRun.status}
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
                      : run.status === 'stopped'
                      ? <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px]"><AlertTriangle className="h-3 w-3 mr-1" />נעצר</Badge>
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

      {/* Duplicate Groups Detail */}
      {groups.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">קבוצות כפילויות ({groups.length})</p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 text-xs">
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-muted-foreground">{page}/{totalPages}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1">
            {pagedGroups.map(group => (
              <DuplicateGroupRow key={group.groupId} group={group} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DuplicateGroupRow: React.FC<{ group: DupGroup }> = ({ group }) => {
  const [open, setOpen] = useState(false);
  const { winner, properties } = group;
  const losers = properties.filter(p => p.id !== winner?.id);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="p-2.5 flex items-center gap-3 text-xs">
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            <div className="flex-1 min-w-0 grid grid-cols-5 gap-2 items-center">
              <span className="font-medium truncate col-span-2">{winner?.address || '—'}, {winner?.city || ''}</span>
              <span>קומה {winner?.floor ?? '—'} · {winner?.rooms ?? '—'} ח׳</span>
              <span className="font-medium">{winner?.price?.toLocaleString('he-IL') ?? '—'} ₪</span>
              <span className="text-muted-foreground">{properties.length} נכסים</span>
            </div>
            {winner && getSourceBadge(winner.source)}
          </CardContent>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mr-6 border-r border-muted pr-3 space-y-1 py-1">
          {properties.map(prop => {
            const isWinner = prop.id === winner?.id;
            const diff = priceDiffPercent(prop.price, winner?.price ?? null);
            return (
              <div
                key={prop.id}
                className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${isWinner ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' : 'bg-muted/30'}`}
              >
                {isWinner && <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px]">Winner</Badge>}
                <span className="truncate flex-1">{prop.address || '—'}, {prop.city || ''}</span>
                <span>ק׳ {prop.floor ?? '—'}</span>
                <span>{prop.rooms ?? '—'} ח׳</span>
                <span className="font-medium">{prop.price?.toLocaleString('he-IL') ?? '—'} ₪</span>
                {diff && <span className="text-orange-600 dark:text-orange-400 text-[10px]">{diff}</span>}
                {getSourceBadge(prop.source)}
                {prop.source_url && (
                  <a href={prop.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80" onClick={e => e.stopPropagation()}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
