import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Calendar } from 'lucide-react';
import { Tooltip as RechartsTooltip, ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Cell } from 'recharts';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  running: '#3b82f6',
  failed: '#ef4444',
};

export const AvailabilityTimeline: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  const { data: todayRuns } = useQuery({
    queryKey: ['availability-timeline'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('availability_check_runs')
        .select('id, started_at, completed_at, status, properties_checked, inactive_marked')
        .gte('started_at', today.toISOString())
        .order('started_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  if (!todayRuns || todayRuns.length === 0) return null;

  const scatterData = todayRuns.map(run => {
    const startDate = new Date(run.started_at);
    const hour = startDate.getHours() + startDate.getMinutes() / 60;
    const duration = run.completed_at
      ? (new Date(run.completed_at).getTime() - startDate.getTime()) / 1000
      : 0;
    return {
      x: hour,
      y: run.properties_checked || 0,
      status: run.status,
      time: format(startDate, 'HH:mm', { locale: he }),
      duration: Math.round(duration),
      checked: run.properties_checked || 0,
      inactive: run.inactive_marked || 0,
    };
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                טיימליין יומי ({todayRuns.length} ריצות היום)
              </CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[0, 24]}
                    tickCount={9}
                    fontSize={10}
                    tickFormatter={(v: number) => `${Math.floor(v)}:00`}
                    label={{ value: 'שעה', position: 'bottom', fontSize: 10 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    fontSize={10}
                    label={{ value: 'נבדקו', angle: -90, position: 'insideLeft', fontSize: 10 }}
                  />
                  <RechartsTooltip
                    content={({ payload }) => {
                      if (!payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg shadow-lg p-2 text-xs" dir="rtl">
                          <p className="font-medium">שעה: {d.time}</p>
                          <p>נבדקו: {d.checked}</p>
                          <p>הוסרו: {d.inactive}</p>
                          <p>משך: {d.duration} שניות</p>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={scatterData}>
                    {scatterData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.status] || '#94a3b8'} r={6} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
