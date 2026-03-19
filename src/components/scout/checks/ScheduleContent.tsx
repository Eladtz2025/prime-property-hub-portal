import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
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

const TYPE_COLORS: Record<string, { dot: string }> = {
  'scan-rent':    { dot: 'bg-cyan-500' },
  'scan-sale':    { dot: 'bg-cyan-600' },
  'matching':     { dot: 'bg-emerald-500' },
  'availability': { dot: 'bg-blue-500' },
  'backfill':     { dot: 'bg-orange-500' },
  'cleanup':      { dot: 'bg-violet-400' },
};

const getTypeKey = (type: string, propertyType?: string) => {
  if (type === 'scan') return propertyType === 'rent' ? 'scan-rent' : 'scan-sale';
  return type;
};

const getTypeDot = (type: string, propertyType?: string) =>
  TYPE_COLORS[getTypeKey(type, propertyType)]?.dot || TYPE_COLORS['cleanup'].dot;

const NextRunCard = ({ group }: { group: { time: string; endTime?: string; items: ScheduleItem[] } }) => {
  const first = group.items[0];
  const dot = getTypeDot(first.type, first.propertyType);
  const timeDisplay = group.endTime ? `${group.time}–${group.endTime}` : group.time;

  return (
    <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] p-2.5 mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          <span className="text-[13px] font-semibold text-gray-100">{first.label}</span>
          {group.items.length > 1 && (
            <span className="text-[10px] text-gray-500">+{group.items.length - 1}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-medium text-gray-300">{timeDisplay}</span>
          <span className="text-[9px] text-emerald-400 font-medium">הבאה בתור</span>
        </div>
      </div>
    </div>
  );
};

const ScheduleRow = ({ group }: { group: { time: string; endTime?: string; items: ScheduleItem[] } }) => {
  const timeDisplay = group.endTime ? `${group.time}–${group.endTime}` : group.time;

  return (
    <div className="flex items-center gap-2 h-[36px] py-1.5 px-2 border-b border-white/[0.04] last:border-0">
      <span className="font-mono text-[11px] text-gray-500 w-[80px] shrink-0 text-right">{timeDisplay}</span>
      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
        {group.items.map((item, idx) => {
          const dot = getTypeDot(item.type, item.propertyType);
          return (
            <span key={idx} className="inline-flex items-center gap-1 text-[11px] text-gray-400">
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const ScheduleContent: React.FC = () => {
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

  const groupedByTime = React.useMemo(() => {
    const sorted = [...scheduleItems].filter(i => !i.isInterval).sort((a, b) =>
      parseInt(a.time.replace(':', '')) - parseInt(b.time.replace(':', ''))
    );
    const map: Record<string, ScheduleItem[]> = {};
    const order: string[] = [];
    sorted.forEach(item => {
      if (!map[item.time]) { map[item.time] = []; order.push(item.time); }
      map[item.time].push(item);
    });
    return order.map(time => ({ time, endTime: map[time][0]?.endTime, items: map[time] }));
  }, [scheduleItems]);

  const nextTimeSlot = React.useMemo(() => {
    const now = new Date();
    const nowStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' }).replace(':', '');
    for (const group of groupedByTime) {
      if (parseInt(group.time.replace(':', '')) >= parseInt(nowStr)) return group.time;
    }
    return groupedByTime[0]?.time;
  }, [groupedByTime]);

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
    <div className="h-full overflow-y-auto p-4">
      {nextGroup && <NextRunCard group={nextGroup} />}

      <div className="grid grid-cols-2 gap-0">
        {/* Right column — Scans */}
        <div className="border-l border-white/[0.06] pl-2">
          <span className="text-[10px] font-medium text-gray-500 mb-1 block">סריקות</span>
          {scanGroups.map((group, idx) => (
            <ScheduleRow key={`scan-${group.time}-${idx}`} group={group} />
          ))}
        </div>
        {/* Left column — Other runs */}
        <div className="pr-2">
          <span className="text-[10px] font-medium text-gray-500 mb-1 block">ריצות</span>
          {otherGroups.map((group, idx) => (
            <ScheduleRow key={`other-${group.time}-${idx}`} group={group} />
          ))}
        </div>
      </div>

      <div className="text-center text-[10px] text-gray-600 mt-4">
        {groupedByTime.length} משימות מתוזמנות
      </div>
    </div>
  );
};
