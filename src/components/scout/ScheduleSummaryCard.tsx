import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle2,
  XCircle,
  Loader2,
  StopCircle,
  Activity
} from 'lucide-react';
import { useScoutSettings } from '@/hooks/useScoutSettings';

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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    case 'failed': return <XCircle className="h-3 w-3 text-red-500" />;
    case 'running': return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />;
    case 'stopped': return <StopCircle className="h-3 w-3 text-yellow-500" />;
    default: return <CheckCircle2 className="h-3 w-3 text-muted-foreground" />;
  }
};

const getTypeColor = (type: ScheduleItem['type'], propertyType?: string) => {
  if (type === 'scan') {
    return propertyType === 'rent' ? 'bg-orange-400' : 'bg-orange-600';
  }
  switch (type) {
    case 'matching': return 'bg-green-500';
    case 'availability': return 'bg-blue-500';
    case 'backfill': return 'bg-yellow-500';
    case 'cleanup': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
};

const Legend = () => (
  <div className="flex flex-wrap gap-1.5">
    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />השכרה
    </span>
    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />מכירה
    </span>
    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />התאמות
    </span>
    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />זמינות
    </span>
  </div>
);

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

  const { data: recentRuns } = useQuery({
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
          summary: `${(run.properties_found ?? 0).toLocaleString('he-IL')} נמצאו, ${(run.new_properties ?? 0).toLocaleString('he-IL')} חדשים`,
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
          summary = `${(run.processed_items ?? 0).toLocaleString('he-IL')} נבדקו, ${(run.successful_items ?? 0).toLocaleString('he-IL')} כפילויות`;
        } else {
          summary = `${(run.processed_items ?? 0).toLocaleString('he-IL')} עובדו, ${(run.successful_items ?? 0).toLocaleString('he-IL')} הצליחו`;
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
          summary: `${(run.properties_checked ?? 0).toLocaleString('he-IL')} נבדקו, ${(run.inactive_marked ?? 0).toLocaleString('he-IL')} לא זמינים`,
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
          summary: `${(run.properties_found ?? 0).toLocaleString('he-IL')} נבדקו, ${(run.new_properties ?? 0).toLocaleString('he-IL')} התאמות`,
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

  const fixedItems = scheduleItems.filter(item => !item.isInterval);
  const sortedFixedItems = [...fixedItems].sort((a, b) => {
    const timeA = a.time.replace(':', '');
    const timeB = b.time.replace(':', '');
    return parseInt(timeA) - parseInt(timeB);
  });

  const groupedByTime = sortedFixedItems.reduce((acc, item) => {
    if (!acc[item.time]) acc[item.time] = [];
    acc[item.time].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  return (
    <div className="mt-4 space-y-2">
      {/* Shared legend */}
      <div className="flex justify-end px-1">
        <Legend />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Schedule Card */}
        <Card>
          <CardHeader className="py-2.5 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              לוח זמנים
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="space-y-1 max-h-[250px] overflow-y-auto">
              {Object.entries(groupedByTime).map(([time, items]) => (
                <div key={time} className="flex items-center gap-2 py-1 border-b border-border/30 last:border-0">
                  <span className="font-mono text-xs w-24 font-medium shrink-0">
                    {items[0]?.endTime ? `${time} - ${items[0].endTime}` : time}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {items.map((item, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px] h-5 px-1.5 flex items-center gap-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${getTypeColor(item.type, item.propertyType)}`} />
                        {item.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Runs Card */}
        <Card>
          <CardHeader className="py-2.5 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              ריצות אחרונות
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="space-y-1 max-h-[250px] overflow-y-auto">
              {!recentRuns || recentRuns.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">אין ריצות ב-24 שעות אחרונות</p>
              ) : (
                recentRuns.map((run, idx) => (
                  <div key={idx} className="flex items-center gap-2 py-1 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-1 shrink-0">
                      {getStatusIcon(run.status)}
                      <span className={`w-1.5 h-1.5 rounded-full ${getTypeColor(run.type, run.propertyType)}`} />
                    </div>
                    <span className="text-[11px] font-medium w-24 shrink-0 truncate">{run.task}</span>
                    <span className="font-mono text-[10px] text-muted-foreground w-11 shrink-0">{run.time}</span>
                    <span className="font-mono text-[10px] text-muted-foreground w-12 shrink-0">{run.duration}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{run.summary}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
