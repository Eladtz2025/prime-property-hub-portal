import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  RefreshCw, 
  Target, 
  Link, 
  Calendar as CalendarIcon,
  Search,
  Trash2,
  Home,
  Tag
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

export const ScheduleSummaryCard: React.FC = () => {
  const { data: settings } = useScoutSettings();

  // Fetch active scout configs with their schedule_times and property_type
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

  // Build schedule items from real data only
  const scheduleItems = React.useMemo(() => {
    const items: ScheduleItem[] = [];

    // 1. Duplicate cleanup - from settings
    const dedupTimes = settings?.duplicates?.schedule_times || ['00:00'];
    dedupTimes.forEach(time => {
      items.push({ time, endTime: settings?.duplicates?.schedule_end_time, label: 'ניקוי כפילויות', type: 'cleanup' });
    });

    // 2. Backfill - from settings
    const backfillTimes = settings?.backfill?.schedule_times || ['03:00'];
    backfillTimes.forEach(time => {
      items.push({ time, endTime: settings?.backfill?.schedule_end_time, label: 'השלמת נתונים', type: 'backfill' });
    });

    // 3. Availability - from settings
    const availTimes = settings?.availability?.schedule_times || ['05:00'];
    availTimes.forEach(time => {
      items.push({ time, endTime: settings?.availability?.schedule_end_time, label: 'בדיקת זמינות', type: 'availability' });
    });

    // 4. Matching - from settings
    const matchingTimes = settings?.matching?.schedule_times || ['23:00'];
    matchingTimes.forEach(time => {
      items.push({ time, endTime: settings?.matching?.schedule_end_time, label: 'התאמה ללקוחות', type: 'matching' });
    });

    // 4. Add scan times from active configs - with property_type
    scoutConfigs?.forEach(config => {
      const times = (config as any).schedule_times as string[] | null;
      if (!times || times.length === 0) return;

      const sourceLabel = config.source === 'yad2' ? 'יד2' : 
                          config.source === 'madlan' ? 'מדלן' : 'הומלס';
      const propertyType = (config as any).property_type as string | null;
      const typeLabel = propertyType === 'rent' ? 'השכרה' : 'מכירה';

      times.forEach(time => {
        items.push({ 
          time, 
          label: `${sourceLabel} ${typeLabel}`, 
          type: 'scan',
          source: config.source,
          propertyType: propertyType || undefined
        });
      });
    });

    return items;
  }, [settings, scoutConfigs]);

  // Group by interval vs fixed time
  const intervalItems = scheduleItems.filter(item => item.isInterval);
  const fixedItems = scheduleItems.filter(item => !item.isInterval);

  // Sort fixed items by time
  const sortedFixedItems = [...fixedItems].sort((a, b) => {
    const timeA = a.time.replace(':', '');
    const timeB = b.time.replace(':', '');
    return parseInt(timeA) - parseInt(timeB);
  });

  // Group fixed items by time for display
  const groupedByTime = sortedFixedItems.reduce((acc, item) => {
    if (!acc[item.time]) acc[item.time] = [];
    acc[item.time].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

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

  const getTypeIcon = (type: ScheduleItem['type']) => {
    switch (type) {
      case 'scan': return <Search className="h-3 w-3" />;
      case 'matching': return <Target className="h-3 w-3" />;
      case 'availability': return <Link className="h-3 w-3" />;
      case 'backfill': return <CalendarIcon className="h-3 w-3" />;
      case 'cleanup': return <Trash2 className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getPropertyTypeIcon = (propertyType?: string) => {
    if (propertyType === 'rent') {
      return <Home className="h-3 w-3" />;
    }
    return <Tag className="h-3 w-3" />;
  };

  return (
    <Card className="mt-4">
      <CardHeader className="py-2.5 px-4">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            לוח זמנים יומי
          </div>
          {/* Compact Legend as inline badges */}
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
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-4">
        <div>
          <div className="space-y-1 max-h-[250px] overflow-y-auto">
            {Object.entries(groupedByTime).map(([time, items]) => (
              <div key={time} className="flex items-center gap-2 py-1 border-b border-border/30 last:border-0">
                <span className="font-mono text-xs w-24 font-medium shrink-0">
                  {items[0]?.endTime ? `${time} - ${items[0].endTime}` : time}
                </span>
                <div className="flex flex-wrap gap-1">
                  {items.map((item, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="text-[10px] h-5 px-1.5 flex items-center gap-0.5"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${getTypeColor(item.type, item.propertyType)}`} />
                      {item.label}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
