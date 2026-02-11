import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface BreakdownItem {
  source: string;
  availability_check_reason: string;
  count: number;
}

const REASON_LABELS: Record<string, string> = {
  content_ok: 'אקטיבי',
  listing_removed_indicator: 'הוסר',
  per_property_timeout: 'Timeout',
  firecrawl_failed_after_retries: 'Firecrawl נכשל',
  short_removal_page_suspicious: 'חשוד - דף קצר',
  no_indicators_keeping_active: 'ללא אינדיקטורים',
  short_content_no_indicators: 'תוכן קצר',
  head_http_404: 'HEAD 404',
  head_http_410: 'HEAD 410',
  head_redirect_away: 'הפניה החוצה',
  head_redirect_to_home: 'הפניה לדף הבית',
  http_404: 'HTTP 404',
  http_410: 'HTTP 410',
  redirect_to_home: 'הפניה לבית',
};

const REASON_COLORS: Record<string, string> = {
  content_ok: '#22c55e',
  listing_removed_indicator: '#ef4444',
  per_property_timeout: '#f97316',
  firecrawl_failed_after_retries: '#eab308',
  short_removal_page_suspicious: '#a855f7',
  no_indicators_keeping_active: '#6b7280',
  head_http_404: '#dc2626',
  head_redirect_away: '#b91c1c',
};

export const AvailabilityStats: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  const { data: breakdown } = useQuery({
    queryKey: ['availability-breakdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scouted_properties')
        .select('source, availability_check_reason')
        .not('availability_check_reason', 'is', null);
      if (error) throw error;

      // Aggregate in JS since we can't GROUP BY via PostgREST
      const counts: Record<string, Record<string, number>> = {};
      const reasonTotals: Record<string, number> = {};
      for (const row of data || []) {
        const reason = row.availability_check_reason || 'unknown';
        const src = row.source || 'unknown';
        if (!counts[reason]) counts[reason] = {};
        counts[reason][src] = (counts[reason][src] || 0) + 1;
        reasonTotals[reason] = (reasonTotals[reason] || 0) + 1;
      }

      return { counts, reasonTotals, total: data?.length || 0 };
    },
    refetchInterval: 30000,
  });

  if (!breakdown) return null;

  const pieData = Object.entries(breakdown.reasonTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([reason, count]) => ({
      name: REASON_LABELS[reason] || reason,
      value: count,
      fill: REASON_COLORS[reason] || '#94a3b8',
    }));

  const sourceData: Record<string, Record<string, number>> = {};
  for (const [reason, sources] of Object.entries(breakdown.counts)) {
    for (const [src, count] of Object.entries(sources)) {
      if (!sourceData[src]) sourceData[src] = {};
      sourceData[src][reason] = count;
    }
  }

  const barData = Object.entries(sourceData).map(([source, reasons]) => ({
    source,
    content_ok: reasons.content_ok || 0,
    listing_removed_indicator: reasons.listing_removed_indicator || 0,
    per_property_timeout: reasons.per_property_timeout || 0,
    no_indicators_keeping_active: reasons.no_indicators_keeping_active || 0,
    other: Object.entries(reasons)
      .filter(([k]) => !['content_ok', 'listing_removed_indicator', 'per_property_timeout', 'no_indicators_keeping_active'].includes(k))
      .reduce((sum, [, v]) => sum + v, 0),
  }));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                פירוט תוצאות ({breakdown.total.toLocaleString('he-IL')} נבדקו)
              </CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0 space-y-4">
            {/* Reason breakdown badges */}
            <div className="flex flex-wrap gap-2">
              {pieData.map(item => (
                <Badge key={item.name} variant="outline" className="text-xs gap-1.5 py-1">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  {item.name}: {item.value.toLocaleString('he-IL')}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pie chart */}
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      fontSize={10}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString('he-IL')} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar chart by source */}
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical">
                    <XAxis type="number" fontSize={10} />
                    <YAxis type="category" dataKey="source" width={70} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="content_ok" stackId="a" fill="#22c55e" name="אקטיבי" />
                    <Bar dataKey="listing_removed_indicator" stackId="a" fill="#ef4444" name="הוסר" />
                    <Bar dataKey="per_property_timeout" stackId="a" fill="#f97316" name="Timeout" />
                    <Bar dataKey="no_indicators_keeping_active" stackId="a" fill="#6b7280" name="ללא אינדיקטורים" />
                    <Bar dataKey="other" stackId="a" fill="#94a3b8" name="אחר" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
