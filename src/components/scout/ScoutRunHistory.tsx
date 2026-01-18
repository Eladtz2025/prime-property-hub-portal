import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, isToday, isYesterday } from 'date-fns';
import { he } from 'date-fns/locale';
import { CheckCircle, XCircle, Loader2, Calendar, ChevronDown, Clock, AlertTriangle } from 'lucide-react';

interface ScoutRun {
  id: string;
  config_id: string | null;
  source: string;
  status: string;
  properties_found: number;
  new_properties: number;
  leads_matched: number;
  whatsapp_sent: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  scout_configs?: {
    name: string;
  } | null;
}

interface HourSummary {
  hour: string;
  runs: ScoutRun[];
  totalFound: number;
  totalNew: number;
  totalMatched: number;
  sources: string[];
  hasErrors: boolean;
  isRunning: boolean;
}

interface DaySummary {
  dayKey: string;
  hours: Record<string, HourSummary>;
  totalFound: number;
  totalNew: number;
  totalMatched: number;
}

export const ScoutRunHistory: React.FC = () => {
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const [selectedHour, setSelectedHour] = useState<HourSummary | null>(null);

  const { data: runs, isLoading } = useQuery({
    queryKey: ['scout-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_runs')
        .select(`
          *,
          scout_configs (
            name
          )
        `)
        .order('started_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as ScoutRun[];
    },
    refetchInterval: 10000
  });

  const groupedData = useMemo(() => {
    if (!runs) return [];

    const dayGroups: Record<string, DaySummary> = {};

    runs.forEach(run => {
      const date = new Date(run.started_at);
      const dayKey = format(date, 'yyyy-MM-dd');
      const hourKey = format(date, 'HH:00');

      if (!dayGroups[dayKey]) {
        dayGroups[dayKey] = {
          dayKey,
          hours: {},
          totalFound: 0,
          totalNew: 0,
          totalMatched: 0
        };
      }

      if (!dayGroups[dayKey].hours[hourKey]) {
        dayGroups[dayKey].hours[hourKey] = {
          hour: hourKey,
          runs: [],
          totalFound: 0,
          totalNew: 0,
          totalMatched: 0,
          sources: [],
          hasErrors: false,
          isRunning: false
        };
      }

      const hourGroup = dayGroups[dayKey].hours[hourKey];
      hourGroup.runs.push(run);
      hourGroup.totalFound += run.properties_found || 0;
      hourGroup.totalNew += run.new_properties || 0;
      hourGroup.totalMatched += run.leads_matched || 0;
      if (!hourGroup.sources.includes(run.source)) {
        hourGroup.sources.push(run.source);
      }
      if (run.status === 'failed') hourGroup.hasErrors = true;
      if (run.status === 'running') hourGroup.isRunning = true;

      dayGroups[dayKey].totalFound += run.properties_found || 0;
      dayGroups[dayKey].totalNew += run.new_properties || 0;
      dayGroups[dayKey].totalMatched += run.leads_matched || 0;
    });

    return Object.values(dayGroups).sort((a, b) => b.dayKey.localeCompare(a.dayKey));
  }, [runs]);

  const formatDayLabel = (dayKey: string) => {
    const date = new Date(dayKey);
    if (isToday(date)) return `היום - ${format(date, 'dd/MM/yyyy')}`;
    if (isYesterday(date)) return `אתמול - ${format(date, 'dd/MM/yyyy')}`;
    return format(date, 'EEEE - dd/MM/yyyy', { locale: he });
  };

  const getSourceBadge = (source: string) => {
    switch (source.toLowerCase()) {
      case 'yad2':
        return <Badge className="bg-orange-500 text-white text-[10px]">Yad2</Badge>;
      case 'homeless':
        return <Badge className="bg-purple-500 text-white text-[10px]">Homeless</Badge>;
      case 'madlan':
        return <Badge className="bg-blue-500 text-white text-[10px]">Madlan</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{source}</Badge>;
    }
  };

  const getHourStatus = (hourSummary: HourSummary) => {
    if (hourSummary.isRunning) {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    if (hourSummary.hasErrors) {
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const calculateDuration = (started: string, completed: string | null) => {
    if (!completed) return 'עדיין רץ...';
    const start = new Date(started);
    const end = new Date(completed);
    const diffMs = end.getTime() - start.getTime();
    const diffSecs = Math.round(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs} שניות`;
    const diffMins = Math.round(diffSecs / 60);
    return `${diffMins} דקות`;
  };

  const toggleDay = (dayKey: string) => {
    setOpenDays(prev => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            היסטוריית סריקות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {groupedData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              אין היסטוריית ריצות
            </div>
          )}

          {groupedData.map((day, index) => (
            <Collapsible
              key={day.dayKey}
              open={openDays[day.dayKey] ?? index === 0}
              onOpenChange={() => toggleDay(day.dayKey)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatDayLabel(day.dayKey)}</span>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                    <span className="hidden sm:inline">נמצאו: <strong>{day.totalFound}</strong></span>
                    <span className="text-green-600">חדשות: <strong>{day.totalNew}</strong></span>
                    <span className="hidden sm:inline">התאמות: <strong>{day.totalMatched}</strong></span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openDays[day.dayKey] ?? index === 0 ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-2">
                {/* Desktop Table */}
                <div className="hidden md:block rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">שעה</TableHead>
                        <TableHead>מקורות</TableHead>
                        <TableHead className="w-[80px]">נמצאו</TableHead>
                        <TableHead className="w-[80px]">חדשות</TableHead>
                        <TableHead className="w-[80px]">התאמות</TableHead>
                        <TableHead className="w-[60px]">סטטוס</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.values(day.hours)
                        .sort((a, b) => b.hour.localeCompare(a.hour))
                        .map((hourSummary) => (
                          <TableRow 
                            key={hourSummary.hour} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedHour(hourSummary)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {hourSummary.hour}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {hourSummary.sources.map(source => (
                                  <span key={source}>{getSourceBadge(source)}</span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{hourSummary.totalFound}</TableCell>
                            <TableCell className="text-green-600 font-medium">{hourSummary.totalNew}</TableCell>
                            <TableCell>{hourSummary.totalMatched}</TableCell>
                            <TableCell>{getHourStatus(hourSummary)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-2">
                  {Object.values(day.hours)
                    .sort((a, b) => b.hour.localeCompare(a.hour))
                    .map((hourSummary) => (
                      <div 
                        key={hourSummary.hour}
                        className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedHour(hourSummary)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{hourSummary.hour}</span>
                          </div>
                          {getHourStatus(hourSummary)}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {hourSummary.sources.map(source => (
                            <span key={source}>{getSourceBadge(source)}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span>נמצאו: <strong>{hourSummary.totalFound}</strong></span>
                          <span className="text-green-600">חדשות: <strong>{hourSummary.totalNew}</strong></span>
                          <span>התאמות: <strong>{hourSummary.totalMatched}</strong></span>
                        </div>
                      </div>
                    ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      {/* Hour Details Dialog */}
      <Dialog open={!!selectedHour} onOpenChange={() => setSelectedHour(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              פרטי סריקה - {selectedHour?.hour}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedHour?.runs.map((run) => (
              <div key={run.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  {getSourceBadge(run.source)}
                  <div className="flex items-center gap-2">
                    {run.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {run.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                    {run.status === 'running' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(run.started_at), 'HH:mm:ss')}
                    </span>
                  </div>
                </div>
                
                {run.scout_configs?.name && (
                  <p className="text-sm text-muted-foreground">
                    הגדרה: {run.scout_configs.name}
                  </p>
                )}
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="font-bold">{run.properties_found || 0}</div>
                    <div className="text-[10px] text-muted-foreground">נמצאו</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded">
                    <div className="font-bold text-green-600">{run.new_properties || 0}</div>
                    <div className="text-[10px] text-muted-foreground">חדשות</div>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <div className="font-bold">{run.leads_matched || 0}</div>
                    <div className="text-[10px] text-muted-foreground">התאמות</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>משך: {calculateDuration(run.started_at, run.completed_at)}</span>
                  {run.whatsapp_sent > 0 && (
                    <span>WhatsApp: {run.whatsapp_sent}</span>
                  )}
                </div>
                
                {run.error_message && (
                  <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded text-xs text-red-600">
                    {run.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
