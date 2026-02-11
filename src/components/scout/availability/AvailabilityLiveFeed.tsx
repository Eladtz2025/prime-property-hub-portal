import React, { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Loader2, ExternalLink, AlertTriangle, Radio } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface RunDetail {
  property_id: string;
  source_url?: string;
  address?: string;
  source?: string;
  reason: string;
  is_inactive: boolean;
  checked_at?: string;
}

interface ActiveRun {
  id: string;
  started_at: string;
  properties_checked: number | null;
  run_details: Json;
}

const ResultIcon: React.FC<{ reason: string; isInactive: boolean }> = ({ reason, isInactive }) => {
  if (isInactive) return <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />;
  if (reason === 'content_ok') return <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />;
  if (reason.includes('timeout')) return <Clock className="h-3.5 w-3.5 text-orange-500 shrink-0" />;
  return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />;
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
  return reason;
};

const sourceBgClass = (source?: string) => {
  switch (source?.toLowerCase()) {
    case 'yad2': return 'text-orange-600';
    case 'madlan': return 'text-blue-600';
    case 'homeless': return 'text-purple-600';
    default: return 'text-muted-foreground';
  }
};

export const AvailabilityLiveFeed: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: activeRun } = useQuery({
    queryKey: ['availability-active-run'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_check_runs')
        .select('id, started_at, properties_checked, run_details')
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ActiveRun | null;
    },
    refetchInterval: 3000,
  });

  const details: RunDetail[] = activeRun?.run_details
    ? (Array.isArray(activeRun.run_details) ? activeRun.run_details as unknown as RunDetail[] : [])
    : [];

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [details.length]);

  if (!activeRun) return null;

  const checked = details.length;
  const activeCount = details.filter(d => !d.is_inactive && d.reason === 'content_ok').length;
  const removedCount = details.filter(d => d.is_inactive).length;
  const elapsed = Math.round((Date.now() - new Date(activeRun.started_at).getTime()) / 1000);
  const elapsedStr = elapsed < 60 ? `${elapsed} שניות` : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')} דקות`;

  return (
    <Card className="border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/20">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-blue-500 animate-pulse" />
            <span className="text-sm font-medium">בדיקה חיה</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{elapsedStr}</span>
            <Badge variant="outline" className="text-[10px]">נבדקו: {checked}</Badge>
            {activeCount > 0 && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px]">
                {activeCount} אקטיביים
              </Badge>
            )}
            {removedCount > 0 && (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px]">
                {removedCount} הוסרו
              </Badge>
            )}
          </div>
        </div>

        {/* Progress - indeterminate since we don't know total */}
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500 shrink-0" />
          <Progress value={undefined} className="h-1.5 flex-1 [&>div]:animate-pulse [&>div]:bg-blue-500" />
        </div>

        {/* Feed */}
        <div
          ref={scrollRef}
          className="max-h-[240px] overflow-y-auto space-y-1 scrollbar-thin"
        >
          {details.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              ממתין לתוצאות ראשונות...
            </div>
          ) : (
            details.map((detail, i) => (
              <div
                key={`${detail.property_id}-${i}`}
                className={`flex items-center gap-2 text-xs py-1 px-2 rounded ${
                  detail.is_inactive ? 'bg-red-50 dark:bg-red-900/10' : ''
                } ${i === details.length - 1 ? 'animate-pulse' : ''}`}
              >
                <ResultIcon reason={detail.reason} isInactive={detail.is_inactive} />
                <span className="truncate flex-1 min-w-0">
                  {detail.address || detail.property_id?.slice(0, 8) + '...'}
                </span>
                <span className={`text-[10px] font-medium shrink-0 ${sourceBgClass(detail.source)}`}>
                  {detail.source || ''}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {reasonLabel(detail.reason, detail.is_inactive)}
                </span>
                {detail.source_url && (
                  <a
                    href={detail.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
