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
  created_at: string;
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
          created_at,
          scout_configs(name, max_pages)
        `)
        .eq('status', 'running')
        .order('created_at', { ascending: false });
      
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

  const getElapsedTime = (createdAt: string) => {
    const elapsed = Date.now() - new Date(createdAt).getTime();
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
    <div className="space-y-4 mb-6">
      {activeRuns.map((run) => {
        const pageStats = run.page_stats || [];
        const maxPages = run.config?.max_pages || 8;
        const currentPage = pageStats.length;
        const progressPercent = (currentPage / maxPages) * 100;
        const totalFound = pageStats.reduce((sum, p) => sum + (p.found || 0), 0);
        const totalNew = pageStats.reduce((sum, p) => sum + (p.new || 0), 0);

        return (
          <Card key={run.id} className="border-primary/50 bg-primary/5">
            <CardHeader className="py-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-primary animate-pulse" />
                  <span>סריקה פעילה: {run.config?.name || getSourceLabel(run.source)}</span>
                  <Badge variant="outline" className="text-xs">
                    {getSourceLabel(run.source)}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground font-normal">
                  {getElapsedTime(run.created_at)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              {/* Progress summary */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>עמוד {currentPage}/{maxPages}</span>
                    <span className="text-muted-foreground">
                      נמצאו: <span className="text-foreground font-medium">{totalFound}</span>
                      {' | '}
                      חדשים: <span className="text-primary font-medium">{totalNew}</span>
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              </div>

              {/* Page-by-page breakdown */}
              {pageStats.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-right px-3 py-2 font-medium">עמוד</th>
                        <th className="text-right px-3 py-2 font-medium">סטטוס</th>
                        <th className="text-right px-3 py-2 font-medium">נמצאו</th>
                        <th className="text-right px-3 py-2 font-medium">חדשים</th>
                        <th className="text-right px-3 py-2 font-medium">משך</th>
                        <th className="text-right px-3 py-2 font-medium">הערות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageStats.map((stat, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2">{stat.page}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              {getPageStatusIcon(stat)}
                              <span className="text-xs">
                                {stat.found > 0 ? 'הושלם' : stat.error ? 'נכשל' : 'ריק'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2">{stat.found || 0}</td>
                          <td className="px-3 py-2 text-primary">{stat.new || 0}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {formatDuration(stat.duration_ms)}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground max-w-[150px] truncate">
                            {stat.error || '—'}
                          </td>
                        </tr>
                      ))}
                      {/* Show pending pages */}
                      {Array.from({ length: maxPages - currentPage }, (_, i) => (
                        <tr key={`pending-${i}`} className="border-t opacity-50">
                          <td className="px-3 py-2">{currentPage + i + 1}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              {i === 0 ? (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              ) : (
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="text-xs">
                                {i === 0 ? 'סורק...' : 'ממתין'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2">—</td>
                          <td className="px-3 py-2">—</td>
                          <td className="px-3 py-2">—</td>
                          <td className="px-3 py-2">—</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
