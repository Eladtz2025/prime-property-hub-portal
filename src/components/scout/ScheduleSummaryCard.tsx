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

    // 1. Add interval-based cron jobs (always running)
    items.push({ 
      time: '*/10', 
      label: 'סריקת נכסים (Cron)', 
      type: 'scan', 
      isInterval: true 
    });
    items.push({ 
      time: '*/15', 
      label: 'התאמה ללקוחות (Cron)', 
      type: 'matching', 
      isInterval: true 
    });
    items.push({ 
      time: '*/5', 
      label: 'ניקוי ריצות תקועות', 
      type: 'cleanup', 
      isInterval: true 
    });

    // 2. Add fixed-time jobs
    // Availability check - 05:00 Israel (03:00 UTC)
    items.push({ 
      time: '05:00', 
      label: 'בדיקת זמינות נכסים', 
      type: 'availability' 
    });

    // Backfill - from settings
    const backfillTimes = settings?.backfill?.schedule_times || ['03:00', '12:00'];
    backfillTimes.forEach(time => {
      items.push({ 
        time, 
        label: 'עדכון תאריכי כניסה', 
        type: 'backfill' 
      });
    });

    // 3. Add matching schedule times from settings
    const matchingTimes = settings?.matching?.schedule_times || ['09:15', '18:15'];
    matchingTimes.forEach(time => {
      items.push({ 
        time, 
        label: 'התאמה ללקוחות', 
        type: 'matching' 
      });
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
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          לוח זמנים יומי
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fixed times column */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">ריצות קבועות (שעון ישראל)</h4>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {Object.entries(groupedByTime).map(([time, items]) => (
                <div key={time} className="flex items-start gap-3 py-1.5 border-b border-border/50 last:border-0">
                  <span className="font-mono text-sm w-12 font-medium shrink-0">{time}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-xs flex items-center gap-1"
                      >
                        <span className={`w-2 h-2 rounded-full ${getTypeColor(item.type, item.propertyType)}`} />
                        {item.type === 'scan' && item.propertyType && (
                          <span className="opacity-70">{getPropertyTypeIcon(item.propertyType)}</span>
                        )}
                        {item.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interval column */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">ריצות מחזוריות</h4>
            <div className="space-y-2">
              {intervalItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-1.5">
                  <div className={`p-1.5 rounded ${getTypeColor(item.type)} text-white`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {item.time === '*/5' && 'כל 5 דק׳'}
                    {item.time === '*/10' && 'כל 10 דק׳'}
                    {item.time === '*/15' && 'כל 15 דק׳'}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t">
              <h5 className="text-xs text-muted-foreground mb-2">מקרא צבעים</h5>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-orange-400" /> 
                  <Home className="h-3 w-3 opacity-70" />
                  השכרה
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-orange-600" /> 
                  <Tag className="h-3 w-3 opacity-70" />
                  מכירה
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-green-500" /> התאמות
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> זמינות
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" /> תאריכים
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-gray-400" /> ניקוי
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
