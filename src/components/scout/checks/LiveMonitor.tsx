import React, { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle, XCircle, Clock, Loader2, AlertTriangle, Radio,
  Search, Shield, Copy, Users, Database, Monitor,
} from 'lucide-react';
import { Json } from '@/integrations/supabase/types';
import { format } from 'date-fns';

// Types for different run sources
interface RunDetail {
  property_id: string;
  source_url?: string;
  address?: string;
  source?: string;
  reason: string;
  is_inactive: boolean;
  checked_at?: string;
  price?: number;
  rooms?: number;
  neighborhood?: string;
  floor?: number;
  fields_updated?: string[];
}

interface ActiveProcess {
  type: 'availability' | 'backfill' | 'scan';
  id: string;
  started_at: string;
  status: string;
  details: RunDetail[];
  properties_checked?: number | null;
  total_items?: number | null;
  processed_items?: number | null;
}

const processConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  availability: { icon: <Shield className="h-3 w-3" />, label: 'בדיקת זמינות', color: 'text-blue-400' },
  backfill: { icon: <Database className="h-3 w-3" />, label: 'השלמת נתונים', color: 'text-emerald-400' },
  scan: { icon: <Search className="h-3 w-3" />, label: 'סריקה', color: 'text-orange-400' },
  dedup: { icon: <Copy className="h-3 w-3" />, label: 'כפילויות', color: 'text-purple-400' },
  matching: { icon: <Users className="h-3 w-3" />, label: 'התאמות', color: 'text-pink-400' },
};

const ResultIcon: React.FC<{ reason: string; isInactive: boolean }> = ({ reason, isInactive }) => {
  if (isInactive) return <XCircle className="h-3 w-3 text-red-400 shrink-0" />;
  if (reason === 'content_ok') return <CheckCircle className="h-3 w-3 text-green-400 shrink-0" />;
  if (reason.includes('timeout')) return <Clock className="h-3 w-3 text-orange-400 shrink-0" />;
  if (reason.includes('updated') || reason.includes('completed')) return <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" />;
  return <AlertTriangle className="h-3 w-3 text-yellow-400 shrink-0" />;
};

const reasonLabel = (reason: string, isInactive: boolean): string => {
  if (isInactive) {
    if (reason.includes('removed') || reason.includes('listing')) return 'הוסר';
    if (reason.includes('redirect')) return 'הפניה';
    if (reason.includes('404') || reason.includes('410')) return `HTTP ${reason.match(/\d+/)?.[0] || ''}`;
    return 'לא אקטיבי';
  }
  if (reason === 'content_ok') return 'אקטיבי';
  if (reason.includes('timeout')) return 'Timeout';
  if (reason.includes('no_indicators')) return 'ללא אינדיקטורים';
  if (reason.includes('suspicious')) return 'חשוד';
  if (reason.includes('updated') || reason.includes('completed')) return 'הושלם';
  return reason;
};

const sourceBadge = (source?: string) => {
  switch (source?.toLowerCase()) {
    case 'yad2': return <span className="text-orange-400 font-mono">YAD2</span>;
    case 'madlan': return <span className="text-blue-400 font-mono">MDLN</span>;
    case 'homeless': return <span className="text-purple-400 font-mono">HMLS</span>;
    default: return null;
  }
};

export const LiveMonitor: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Availability active run
  const { data: availRun } = useQuery({
    queryKey: ['monitor-availability-run'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_check_runs')
        .select('id, started_at, properties_checked, run_details, status')
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 2000,
  });

  // Backfill active run
  const { data: backfillRun } = useQuery({
    queryKey: ['monitor-backfill-run'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backfill_progress')
        .select('*')
        .eq('task_name', 'data_completion')
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 2000,
  });

  // Active scan runs
  const { data: scanRuns } = useQuery({
    queryKey: ['monitor-scan-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_runs')
        .select('id, started_at, status, config_id, properties_found, new_properties')
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    refetchInterval: 2000,
  });

  // Build unified feed
  const availDetails: RunDetail[] = availRun?.run_details
    ? (Array.isArray(availRun.run_details) ? availRun.run_details as unknown as RunDetail[] : [])
    : [];

  const hasActivity = !!(availRun || backfillRun || (scanRuns && scanRuns.length > 0));

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [availDetails.length, backfillRun?.processed_items]);

  const activeProcesses: { type: string; label: string; elapsed: string; progress?: number }[] = [];

  if (availRun) {
    const elapsed = Math.round((Date.now() - new Date(availRun.started_at).getTime()) / 1000);
    activeProcesses.push({
      type: 'availability',
      label: `בדיקת זמינות — ${availDetails.length} נבדקו`,
      elapsed: elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`,
    });
  }

  if (backfillRun) {
    const elapsed = Math.round((Date.now() - new Date(backfillRun.started_at!).getTime()) / 1000);
    const pct = backfillRun.total_items ? Math.round(((backfillRun.processed_items ?? 0) / backfillRun.total_items) * 100) : undefined;
    activeProcesses.push({
      type: 'backfill',
      label: `השלמת נתונים — ${backfillRun.processed_items ?? 0}/${backfillRun.total_items ?? '?'}`,
      elapsed: elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`,
      progress: pct,
    });
  }

  if (scanRuns?.length) {
    scanRuns.forEach(run => {
      const elapsed = Math.round((Date.now() - new Date(run.started_at).getTime()) / 1000);
      activeProcesses.push({
        type: 'scan',
        label: `סריקה — ${run.properties_found ?? 0} נמצאו, ${run.new_properties ?? 0} חדשים`,
        elapsed: elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`,
      });
    });
  }

  return (
    <div className="rounded-lg border border-border/50 bg-gray-950 dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-gray-900/80">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-gray-300">מוניטור חי</span>
          {hasActivity && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          )}
        </div>
        {!hasActivity && (
          <span className="text-[10px] text-gray-500">אין פעילות כרגע</span>
        )}
      </div>

      {/* Active processes bar */}
      {activeProcesses.length > 0 && (
        <div className="px-3 py-2 space-y-1.5 border-b border-border/20 bg-gray-900/50">
          {activeProcesses.map((proc, i) => {
            const cfg = processConfig[proc.type];
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 ${cfg?.color || 'text-gray-400'}`}>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {cfg?.icon}
                </div>
                <span className="text-[11px] text-gray-300 flex-1 truncate">{proc.label}</span>
                <span className="text-[10px] text-gray-500 font-mono">{proc.elapsed}</span>
                {proc.progress !== undefined && (
                  <div className="w-16">
                    <Progress value={proc.progress} className="h-1 [&>div]:bg-emerald-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Feed */}
      <div
        ref={scrollRef}
        className="max-h-[300px] overflow-y-auto scrollbar-thin"
        dir="rtl"
      >
        {!hasActivity && availDetails.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-600">
            <div className="text-center space-y-1">
              <Monitor className="h-6 w-6 mx-auto opacity-30" />
              <p className="text-xs">ממתין לפעילות...</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/10">
            {availDetails.map((detail, i) => (
              <div
                key={`avail-${detail.property_id}-${i}`}
                className={`flex items-center gap-2 text-[11px] py-1.5 px-3 hover:bg-gray-800/50 transition-colors ${
                  i === availDetails.length - 1 ? 'bg-gray-800/30' : ''
                }`}
              >
                {/* Timestamp */}
                <span className="text-[10px] text-gray-600 font-mono shrink-0 w-[42px]">
                  {detail.checked_at
                    ? format(new Date(detail.checked_at), 'HH:mm:ss')
                    : '--:--'}
                </span>

                {/* Type icon */}
                <span className="text-blue-400 shrink-0">
                  <Shield className="h-3 w-3" />
                </span>

                {/* Result */}
                <ResultIcon reason={detail.reason} isInactive={detail.is_inactive} />

                {/* Address */}
                <span className="truncate flex-1 min-w-0 text-gray-300">
                  {detail.address || detail.property_id?.slice(0, 8)}
                </span>

                {/* Extra details */}
                {detail.price && (
                  <span className="text-gray-500 text-[10px] shrink-0">
                    ₪{(detail.price / 1000).toFixed(0)}K
                  </span>
                )}
                {detail.rooms && (
                  <span className="text-gray-500 text-[10px] shrink-0">
                    {detail.rooms}ח׳
                  </span>
                )}

                {/* Source */}
                <span className="text-[10px] shrink-0">
                  {sourceBadge(detail.source)}
                </span>

                {/* Reason label */}
                <span className={`text-[10px] shrink-0 ${detail.is_inactive ? 'text-red-400' : 'text-gray-500'}`}>
                  {reasonLabel(detail.reason, detail.is_inactive)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
