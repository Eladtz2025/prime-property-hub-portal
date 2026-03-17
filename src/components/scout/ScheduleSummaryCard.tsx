import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { useScoutSettings } from '@/hooks/useScoutSettings';
import { aggregateConsecutiveRuns, AggregatedRun } from './aggregateRuns';

// ── Types ──────────────────────────────────────────────

interface ScheduleItem {
  time: string;
  endTime?: string;
  label: string;
  type: 'scan' | 'matching' | 'availability' | 'backfill' | 'cleanup';
  isInterval?: boolean;
  source?: string;
  propertyType?: string;
}

interface RunItem {
  task: string;
  time: string;
  duration: string;
  summary: string;
  status: string;
  type: 'scan' | 'matching' | 'availability' | 'backfill' | 'cleanup';
  propertyType?: string;
  startedAt: Date;
}

// ── Helpers ────────────────────────────────────────────

const formatDuration = (startedAt: string, completedAt: string | null): string => {
  if (!completedAt) return 'רץ...';
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMs = end - start;
  const diffMin = Math.floor(diffMs / 60000);
  const diffSec = Math.floor((diffMs % 60000) / 1000);
  if (diffMin === 0) return diffSec > 0 ? `${diffSec} שנ׳` : '<1 שנ׳';
  return `${diffMin} דק׳`;
};

const formatTimeIL = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' });
};

const formatRelativeTime = (date: Date): string => {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'עכשיו';
  if (diffMin < 60) return `לפני ${diffMin} דק׳`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `לפני ${diffHours} שע׳`;
  return formatTimeIL(date.toISOString());
};

const TYPE_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  'scan-rent':     { dot: 'bg-cyan-500',     bg: 'bg-cyan-500/10',    text: 'text-cyan-600' },
  'scan-sale':     { dot: 'bg-cyan-600',     bg: 'bg-cyan-600/10',    text: 'text-cyan-700' },
  'matching':      { dot: 'bg-emerald-500',  bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  'availability':  { dot: 'bg-blue-500',     bg: 'bg-blue-500/10',    text: 'text-blue-600' },
  'backfill':      { dot: 'bg-orange-500',   bg: 'bg-orange-500/10',  text: 'text-orange-600' },
  'cleanup':       { dot: 'bg-violet-400',   bg: 'bg-violet-400/10',  text: 'text-violet-500' },
};

const getTypeKey = (type: string, propertyType?: string) => {
  if (type === 'scan') return propertyType === 'rent' ? 'scan-rent' : 'scan-sale';
  return type;
};

const getTypeColors = (type: string, propertyType?: string) => {
  return TYPE_COLORS[getTypeKey(type, propertyType)] || TYPE_COLORS['cleanup'];
};

const STATUS_DOT: Record<string, string> = {
  completed: 'bg-emerald-500',
  failed: 'bg-destructive',
  running: 'bg-blue-500',
  stopped: 'bg-amber-500',
};

const STATUS_LABEL: Record<string, string> = {
  completed: 'הושלם',
  failed: 'נכשל',
  running: 'בתהליך',
  stopped: 'אזהרה',
};

// ── Sub-components ─────────────────────────────────────

const RunCard = ({ run }: { run: AggregatedRun }) => {
  const colors = getTypeColors(run.type, run.propertyType);
  const statusDot = STATUS_DOT[run.status] || STATUS_DOT['completed'];
  const statusLabel = STATUS_LABEL[run.status] || STATUS_LABEL['completed'];

  return (
    <div className="flex items-center justify-between gap-2 min-h-[54px] py-2 px-2 border-b border-border/15 last:border-0">
      {/* Right — name + metadata */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
          <span className="text-[13px] font-medium truncate">{run.task}</span>
          {run.batchCount > 1 && (
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 shrink-0">
              ×{run.batchCount}
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight truncate pr-2">
          {run.summary} · {run.duration}
        </p>
      </div>

      {/* Left — status dot + text + time */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
          {statusLabel}
        </span>
        <span className="text-[10px] text-muted-foreground/70">
          {formatRelativeTime(run.startedAt)}
        </span>
      </div>
    </div>
  );
};

const LedgerFooter = ({ runs }: { runs: AggregatedRun[] }) => {
  const completed = runs.filter(r => r.status === 'completed').length;
  const warnings = runs.filter(r => r.status === 'stopped' || r.status === 'failed').length;
  return (
    <div className="flex items-center justify-between pt-2 border-t border-border/20 mt-auto">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        {completed > 0 && (
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {completed} הושלמו
          </span>
        )}
        {warnings > 0 && (
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            {warnings} אזהרות
          </span>
        )}
      </div>
      <button className="text-[10px] text-primary font-medium hover:underline">
        הצג הכל
      </button>
    </div>
  );
};

const NextRunCard = ({ group }: { group: { time: string; endTime?: string; items: ScheduleItem[] } }) => {
  const first = group.items[0];
  const colors = getTypeColors(first.type, first.propertyType);
  const timeDisplay = group.endTime ? `${group.time}–${group.endTime}` : group.time;

  return (
    <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
          <span className="text-[13px] font-semibold">{first.label}</span>
          {group.items.length > 1 && (
            <span className="text-[10px] text-muted-foreground">+{group.items.length - 1}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-medium text-foreground">{timeDisplay}</span>
          <span className="text-[9px] text-primary font-medium">הבאה בתור</span>
        </div>
      </div>
    </div>
  );
};

const ScheduleRow = ({ group }: { group: { time: string; endTime?: string; items: ScheduleItem[] } }) => {
  const timeDisplay = group.endTime ? `${group.time}–${group.endTime}` : group.time;

  return (
    <div className="flex items-center gap-2 h-[40px] py-1.5 px-2 border-b border-border/15 last:border-0">
      <span className="font-mono text-[11px] text-muted-foreground w-[90px] shrink-0 text-right">{timeDisplay}</span>
      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
        {group.items.map((item, idx) => {
          const colors = getTypeColors(item.type, item.propertyType);
          return (
            <span key={idx} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────

export const ScheduleSummaryCard: React.FC = () => {
  const { data: settings } = useScoutSettings();

  const { data: scoutConfigs } = useQuery({
    queryKey: ['scout-configs-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_configs')
        .select('id, name, source, is_active, schedule_times, property_type')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const { data: recentRuns, dataUpdatedAt } = useQuery({
    queryKey: ['recent-runs-summary'],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const [scoutRunsRes, backfillRes, availRes, matchRes] = await Promise.all([
        supabase
          .from('scout_runs')
          .select('source, properties_found, new_properties, started_at, completed_at, status, config_id')
          .gte('started_at', since)
          .neq('source', 'matching')
          .order('started_at', { ascending: false }),
        supabase
          .from('backfill_progress')
          .select('task_name, processed_items, successful_items, failed_items, started_at, completed_at, status')
          .gte('started_at', since)
          .order('started_at', { ascending: false }),
        supabase
          .from('availability_check_runs')
          .select('properties_checked, inactive_marked, started_at, completed_at, status')
          .gte('started_at', since)
          .order('started_at', { ascending: false }),
        supabase
          .from('scout_runs')
          .select('source, properties_found, new_properties, started_at, completed_at, status')
          .eq('source', 'matching')
          .gte('started_at', since)
          .order('started_at', { ascending: false }),
      ]);

      const items: RunItem[] = [];

      scoutRunsRes.data?.forEach(run => {
        const sourceLabel = run.source === 'yad2' ? 'יד2' : run.source === 'madlan' ? 'מדלן' : 'הומלס';
        const config = scoutConfigs?.find(c => c.id === run.config_id);
        const propType = (config as any)?.property_type as string | undefined;
        const typeLabel = propType === 'rent' ? 'השכרה' : 'מכירה';
        items.push({
          task: `${sourceLabel} ${typeLabel}`,
          time: formatTimeIL(run.started_at),
          duration: formatDuration(run.started_at, run.completed_at),
          summary: `${(run.properties_found ?? 0).toLocaleString('he-IL')} נמצאו · ${(run.new_properties ?? 0).toLocaleString('he-IL')} חדשים`,
          status: run.status,
          type: 'scan',
          propertyType: propType,
          startedAt: new Date(run.started_at),
        });
      });

      backfillRes.data?.forEach(run => {
        const isDuplicates = run.task_name?.includes('duplicate') || run.task_name?.includes('dedup');
        const label = isDuplicates ? 'ניקוי כפילויות' : 'השלמת נתונים';
        const type = isDuplicates ? 'cleanup' as const : 'backfill' as const;
        let summary: string;
        if (isDuplicates) {
          summary = `${(run.processed_items ?? 0).toLocaleString('he-IL')} נבדקו · ${(run.successful_items ?? 0).toLocaleString('he-IL')} כפילויות`;
        } else {
          summary = `${(run.processed_items ?? 0).toLocaleString('he-IL')} עובדו · ${(run.successful_items ?? 0).toLocaleString('he-IL')} הצליחו`;
        }
        if (run.status === 'stopped') summary += ' (נעצר)';
        items.push({
          task: label,
          time: run.started_at ? formatTimeIL(run.started_at) : '—',
          duration: run.started_at ? formatDuration(run.started_at, run.completed_at) : '—',
          summary,
          status: run.status ?? 'completed',
          type,
          startedAt: run.started_at ? new Date(run.started_at) : new Date(),
        });
      });

      availRes.data?.forEach(run => {
        items.push({
          task: 'בדיקת זמינות',
          time: formatTimeIL(run.started_at),
          duration: formatDuration(run.started_at, run.completed_at),
          summary: `${(run.properties_checked ?? 0).toLocaleString('he-IL')} נבדקו · ${(run.inactive_marked ?? 0).toLocaleString('he-IL')} לא זמינים`,
          status: run.status,
          type: 'availability',
          startedAt: new Date(run.started_at),
        });
      });

      matchRes.data?.forEach(run => {
        items.push({
          task: 'התאמה ללקוחות',
          time: formatTimeIL(run.started_at),
          duration: formatDuration(run.started_at, run.completed_at),
          summary: `${(run.properties_found ?? 0).toLocaleString('he-IL')} נבדקו · ${(run.new_properties ?? 0).toLocaleString('he-IL')} התאמות`,
          status: run.status,
          type: 'matching',
          startedAt: new Date(run.started_at),
        });
      });

      items.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
      return items;
    },
    refetchInterval: 30000,
  });

  // Build schedule items
  const scheduleItems = React.useMemo(() => {
    const items: ScheduleItem[] = [];

    const dedupTimes = settings?.duplicates?.schedule_times || ['03:00'];
    dedupTimes.forEach(time => {
      items.push({ time, endTime: settings?.duplicates?.schedule_end_time, label: 'ניקוי כפילויות', type: 'cleanup' });
    });

    const backfillTimes = settings?.backfill?.schedule_times || ['00:00'];
    backfillTimes.forEach(time => {
      items.push({ time, endTime: settings?.backfill?.schedule_end_time, label: 'השלמת נתונים', type: 'backfill' });
    });

    const availTimes = settings?.availability?.schedule_times || ['05:00'];
    availTimes.forEach(time => {
      items.push({ time, endTime: settings?.availability?.schedule_end_time, label: 'בדיקת זמינות', type: 'availability' });
    });

    const matchingTimes = settings?.matching?.schedule_times || ['07:00'];
    matchingTimes.forEach(time => {
      items.push({ time, endTime: settings?.matching?.schedule_end_time, label: 'התאמה ללקוחות', type: 'matching' });
    });

    scoutConfigs?.forEach(config => {
      const times = (config as any).schedule_times as string[] | null;
      if (!times || times.length === 0) return;
      const sourceLabel = config.source === 'yad2' ? 'יד2' : config.source === 'madlan' ? 'מדלן' : 'הומלס';
      const propertyType = (config as any).property_type as string | null;
      const typeLabel = propertyType === 'rent' ? 'השכרה' : 'מכירה';
      times.forEach(time => {
        items.push({ time, label: `${sourceLabel} ${typeLabel}`, type: 'scan', source: config.source, propertyType: propertyType || undefined });
      });
    });

    return items;
  }, [settings, scoutConfigs]);

  // Group schedule by time
  const groupedByTime = React.useMemo(() => {
    const fixedItems = scheduleItems.filter(item => !item.isInterval);
    const sorted = [...fixedItems].sort((a, b) => {
      const timeA = a.time.replace(':', '');
      const timeB = b.time.replace(':', '');
      return parseInt(timeA) - parseInt(timeB);
    });

    const grouped: { time: string; endTime?: string; items: ScheduleItem[] }[] = [];
    const map: Record<string, ScheduleItem[]> = {};
    const order: string[] = [];

    sorted.forEach(item => {
      if (!map[item.time]) {
        map[item.time] = [];
        order.push(item.time);
      }
      map[item.time].push(item);
    });

    order.forEach(time => {
      grouped.push({ time, endTime: map[time][0]?.endTime, items: map[time] });
    });

    return grouped;
  }, [scheduleItems]);

  // Find which time slot is "next"
  const nextTimeSlot = React.useMemo(() => {
    const now = new Date();
    const nowStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' }).replace(':', '');
    for (const group of groupedByTime) {
      if (parseInt(group.time.replace(':', '')) >= parseInt(nowStr)) return group.time;
    }
    return groupedByTime[0]?.time;
  }, [groupedByTime]);

  // Aggregated runs
  const aggregatedRuns = React.useMemo(() => {
    return recentRuns ? aggregateConsecutiveRuns(recentRuns) : [];
  }, [recentRuns]);

  // Subtitle for ledger
  const lastHourCount = React.useMemo(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return aggregatedRuns.filter(r => r.startedAt.getTime() > oneHourAgo).length;
  }, [aggregatedRuns]);

  const updatedAgo = React.useMemo(() => {
    if (!dataUpdatedAt) return '';
    const diffSec = Math.floor((Date.now() - dataUpdatedAt) / 1000);
    if (diffSec < 10) return 'עודכן עכשיו';
    if (diffSec < 60) return `עודכן לפני ${diffSec} שנ׳`;
    return `עודכן לפני ${Math.floor(diffSec / 60)} דק׳`;
  }, [dataUpdatedAt]);

  // Split schedule: next run + rest, then split by scan vs other
  const nextGroup = groupedByTime.find(g => g.time === nextTimeSlot);
  const restGroups = groupedByTime.filter(g => g.time !== nextTimeSlot);

  const { scanGroups, otherGroups } = React.useMemo(() => {
    const scanGroups: typeof restGroups = [];
    const otherGroups: typeof restGroups = [];
    for (const group of restGroups) {
      const scanItems = group.items.filter(i => i.type === 'scan');
      const otherItems = group.items.filter(i => i.type !== 'scan');
      if (scanItems.length > 0) scanGroups.push({ ...group, items: scanItems });
      if (otherItems.length > 0) otherGroups.push({ ...group, items: otherItems });
    }
    return { scanGroups, otherGroups };
  }, [restGroups]);

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-[58%_42%] gap-4">
      {/* ── Activity Feed ── */}
      <div className="rounded-[20px] border border-border/40 bg-card p-4 h-[340px] flex flex-col shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">פעולות אחרונות</span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {lastHourCount > 0 && `${lastHourCount} בשעה האחרונה · `}{updatedAgo}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {aggregatedRuns.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-12">אין פעילות ב-24 שעות אחרונות</p>
          ) : (
            aggregatedRuns.map((run, idx) => <RunCard key={idx} run={run} />)
          )}
        </div>

        {/* Footer */}
        {aggregatedRuns.length > 0 && <LedgerFooter runs={aggregatedRuns} />}
      </div>

      {/* ── Schedule — Next Runs ── */}
      <div className="rounded-[20px] border border-border/40 bg-card p-4 h-[340px] flex flex-col shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">לוח זמנים</span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {groupedByTime.length} משימות מתוזמנות
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {nextGroup && <NextRunCard group={nextGroup} />}
          <div className="grid grid-cols-2 gap-0">
            {/* Right column — Scans */}
            <div className="border-l border-border/20 pl-2">
              <span className="text-[10px] font-medium text-muted-foreground mb-1 block">סריקות</span>
              {scanGroups.map((group, idx) => (
                <ScheduleRow key={`scan-${group.time}-${idx}`} group={group} />
              ))}
            </div>
            {/* Left column — Other runs */}
            <div className="pr-2">
              <span className="text-[10px] font-medium text-muted-foreground mb-1 block">ריצות</span>
              {otherGroups.map((group, idx) => (
                <ScheduleRow key={`other-${group.time}-${idx}`} group={group} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-border/20 mt-auto">
          <button className="text-[10px] text-primary font-medium hover:underline">
            הצג הכל
          </button>
        </div>
      </div>
    </div>
  );
};
