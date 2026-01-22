import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Clock, Wifi } from 'lucide-react';

interface PageStat {
  page: number;
  url: string;
  found: number;
  new: number;
  duration_ms: number;
  status?: 'pending' | 'scraping' | 'completed' | 'failed' | 'blocked';
  error?: string;
}

interface ActiveRun {
  id: string;
  config_id: string;
  source: string;
  status: string;
  properties_found: number | null;
  new_properties: number | null;
  page_stats: PageStat[] | null;
  started_at: string;
  config?: {
    name: string;
    max_pages?: number;
  };
}

export const LiveScanProgress: React.FC = () => {
  // Fetch active runs with their configs
  const { data: activeRuns, isLoading } = useQuery({
    queryKey: ['live-scan-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_runs')
        .select(`
          id,
          config_id,
          source,
          status,
          properties_found,
          new_properties,
          page_stats,
          started_at,
          scout_configs(name, max_pages)
        `)
        .eq('status', 'running')
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((run: any) => ({
        ...run,
        config: run.scout_configs
      })) as ActiveRun[];
    },
    refetchInterval: 2000, // Poll every 2 seconds
  });

  if (isLoading) {
    return null;
  }

  if (!activeRuns || activeRuns.length === 0) {
    return null;
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}ש`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}ד ${remainingSeconds}ש`;
  };

  const getElapsedTime = (startedAt: string) => {
    const elapsed = Date.now() - new Date(startedAt).getTime();
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPageStatusIcon = (stat: PageStat) => {
    if (stat.status === 'blocked' || stat.error?.includes('CAPTCHA') || stat.error?.includes('captcha')) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    if (stat.status === 'failed' || stat.found === 0 && stat.duration_ms > 0) {
      if (stat.error) {
        return <XCircle className="h-4 w-4 text-destructive" />;
      }
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    if (stat.found > 0) {
      return <CheckCircle2 className="h-4 w-4 text-primary" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'yad2': return 'יד2';
      case 'madlan': return 'מדלן';
      case 'homeless': return 'הומלס';
      default: return source;
    }
  };

  return (
    <div className="space-y-3 mb-4">
      {activeRuns.map((run) => {
        const pageStats = run.page_stats || [];
        const maxPages = run.config?.max_pages || 8;
        const currentPage = pageStats.length;
        const progressPercent = (currentPage / maxPages) * 100;
        const totalFound = pageStats.reduce((sum, p) => sum + (p.found || 0), 0);
        const totalNew = pageStats.reduce((sum, p) => sum + (p.new || 0), 0);
        const completedPages = pageStats.filter(p => p.found > 0 || p.error);
        const failedPages = pageStats.filter(p => p.error);

        return (
          <Card key={run.id} className="border-primary/50 bg-primary/5">
            <CardContent className="py-3 px-4">
              {/* Compact Header + Progress */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wifi className="h-3.5 w-3.5 text-primary animate-pulse" />
                  <span className="text-sm font-medium">{run.config?.name || getSourceLabel(run.source)}</span>
                  <Badge variant="outline" className="text-[10px] h-5">
                    {getSourceLabel(run.source)}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {getElapsedTime(run.started_at)}
                </span>
              </div>
              
              {/* Summary Line + Progress */}
              <div className="flex items-center gap-3 text-xs mb-2">
                <span className="font-medium">{currentPage}/{maxPages} דפים</span>
                <span className="text-muted-foreground">
                  נמצאו: <span className="text-foreground font-medium">{totalFound}</span>
                </span>
                <span className="text-primary">
                  חדשים: <span className="font-medium">{totalNew}</span>
                </span>
                {failedPages.length > 0 && (
                  <span className="text-destructive">
                    נכשלו: {failedPages.length}
                  </span>
                )}
              </div>
              <Progress value={progressPercent} className="h-1.5" />

              {/* Compact page status - only show completed/failed pages */}
              {completedPages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {pageStats.map((stat, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                        stat.error ? 'bg-destructive/10 text-destructive' : 
                        stat.found > 0 ? 'bg-primary/10 text-primary' : 'bg-muted'
                      }`}
                    >
                      {getPageStatusIcon(stat)}
                      <span>עמ׳{stat.page}</span>
                      {stat.found > 0 && <span className="font-medium">({stat.new})</span>}
                    </div>
                  ))}
                  {/* Next pending page indicator */}
                  {currentPage < maxPages && (
                    <div className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>עמ׳{currentPage + 1}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
