import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Clock, Building2, Sparkles, Users, XCircle, AlertTriangle, PartyPopper } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';

interface RunningRun {
  id: string;
  source: string;
  status: string;
  properties_found: number | null;
  new_properties: number | null;
  started_at: string;
  config_id: string | null;
  scout_configs?: { name: string } | null;
}

interface CompletedRun {
  id: string;
  source: string;
  properties_found: number | null;
  new_properties: number | null;
  leads_matched: number | null;
  completed_at: string;
}

interface ConfigProgress {
  name: string;
  source: string;
  running: number;
  completed: number;
  total: number;
  found: number;
  new: number;
}

export const LiveScanStatus: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);
  const [completionData, setCompletionData] = useState<{ total: number; new: number; matched: number } | null>(null);
  
  // Query for running scans - refresh every 3 seconds
  const { data: runningScans } = useQuery({
    queryKey: ['running-scans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_runs')
        .select('id, source, status, properties_found, new_properties, started_at, config_id, scout_configs(name)')
        .eq('status', 'running')
        .order('started_at', { ascending: true });
      
      if (error) throw error;
      return data as RunningRun[];
    },
    refetchInterval: 3000,
  });

  // Query for recently completed scans in this batch (last 5 minutes) to show page progress
  const { data: recentCompleted } = useQuery({
    queryKey: ['recent-completed-scans'],
    queryFn: async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('scout_runs')
        .select('id, source, status, properties_found, new_properties, leads_matched, completed_at, config_id, scout_configs(name)')
        .eq('status', 'completed')
        .gte('completed_at', fiveMinutesAgo)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 3000,
  });

  // Query for last completed batch (aggregate all runs in the last batch for idle state)
  const { data: lastCompletedBatch } = useQuery({
    queryKey: ['last-completed-batch'],
    queryFn: async () => {
      // Get the latest completed run
      const { data: latestRun, error: latestError } = await supabase
        .from('scout_runs')
        .select('completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();
      
      if (latestError || !latestRun) return null;
      
      // Get all runs that completed within 5 minutes of the latest
      const batchWindowStart = new Date(
        new Date(latestRun.completed_at).getTime() - 5 * 60 * 1000
      ).toISOString();
      
      const { data: batchRuns, error: batchError } = await supabase
        .from('scout_runs')
        .select('source, properties_found, new_properties, leads_matched, completed_at')
        .eq('status', 'completed')
        .gte('completed_at', batchWindowStart)
        .order('completed_at', { ascending: false });
      
      if (batchError || !batchRuns?.length) return null;
      
      // Aggregate totals
      return {
        properties_found: batchRuns.reduce((sum, r) => sum + (r.properties_found || 0), 0),
        new_properties: batchRuns.reduce((sum, r) => sum + (r.new_properties || 0), 0),
        leads_matched: batchRuns.reduce((sum, r) => sum + (r.leads_matched || 0), 0),
        completed_at: batchRuns[0].completed_at,
        runs_count: batchRuns.length,
        by_source: batchRuns.reduce((acc, r) => {
          acc[r.source] = (acc[r.source] || 0) + (r.properties_found || 0);
          return acc;
        }, {} as Record<string, number>)
      };
    },
    refetchInterval: 10000,
  });

  // Check for stuck runs (running for more than 10 minutes)
  const stuckRuns = React.useMemo(() => {
    if (!runningScans) return [];
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    return runningScans.filter(run => new Date(run.started_at).getTime() < tenMinutesAgo);
  }, [runningScans]);

  // Mutation to clear stuck runs
  const clearStuckRunsMutation = useMutation({
    mutationFn: async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('scout_runs')
        .update({
          status: 'failed',
          error_message: 'Manually stopped - stuck run',
          completed_at: new Date().toISOString()
        })
        .eq('status', 'running')
        .lt('started_at', tenMinutesAgo);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['running-scans'] });
      queryClient.invalidateQueries({ queryKey: ['recent-completed-scans'] });
      toast.success('ריצות תקועות נוקו בהצלחה');
    },
    onError: (error) => {
      toast.error('שגיאה בניקוי ריצות תקועות');
      console.error('Failed to clear stuck runs:', error);
    }
  });

  const isScanning = runningScans && runningScans.length > 0;
  const wasScanning = React.useRef(false);

  // Detect when scanning just completed and show summary
  useEffect(() => {
    if (wasScanning.current && !isScanning && recentCompleted && recentCompleted.length > 0) {
      // Scanning just finished - show completion summary
      const total = recentCompleted.reduce((sum, r) => sum + (r.properties_found || 0), 0);
      const newProps = recentCompleted.reduce((sum, r) => sum + (r.new_properties || 0), 0);
      const matched = recentCompleted.reduce((sum, r) => sum + (r.leads_matched || 0), 0);
      
      setCompletionData({ total, new: newProps, matched });
      setShowCompletionSummary(true);
      
      // Hide after 15 seconds
      const timer = setTimeout(() => {
        setShowCompletionSummary(false);
        setCompletionData(null);
      }, 15000);
      
      return () => clearTimeout(timer);
    }
    wasScanning.current = isScanning;
  }, [isScanning, recentCompleted]);

  // Group by config_id to show progress per configuration
  const configProgress = React.useMemo(() => {
    const progress: Record<string, ConfigProgress> = {};
    
    // Count running scans per config
    runningScans?.forEach(run => {
      const configId = run.config_id || 'manual';
      const configName = run.scout_configs?.name || run.source;
      if (!progress[configId]) {
        progress[configId] = { 
          name: configName, 
          source: run.source, 
          running: 0, 
          completed: 0, 
          total: 12, 
          found: 0, 
          new: 0 
        };
      }
      progress[configId].running += 1;
      progress[configId].found += run.properties_found || 0;
      progress[configId].new += run.new_properties || 0;
    });
    
    // Count recently completed scans per config
    recentCompleted?.forEach((run: any) => {
      const configId = run.config_id || 'manual';
      const configName = run.scout_configs?.name || run.source;
      if (!progress[configId]) {
        progress[configId] = { 
          name: configName, 
          source: run.source, 
          running: 0, 
          completed: 0, 
          total: 12, 
          found: 0, 
          new: 0 
        };
      }
      progress[configId].completed += 1;
      progress[configId].found += run.properties_found || 0;
      progress[configId].new += run.new_properties || 0;
    });
    
    return progress;
  }, [runningScans, recentCompleted]);

  // Also group by source for summary
  const sourceProgress = React.useMemo(() => {
    const progress: Record<string, { 
      running: number; 
      completed: number; 
      total: number;
      found: number; 
      new: number;
    }> = {};
    
    Object.values(configProgress).forEach(config => {
      const source = config.source;
      if (!progress[source]) {
        progress[source] = { running: 0, completed: 0, total: 0, found: 0, new: 0 };
      }
      progress[source].running += config.running;
      progress[source].completed += config.completed;
      progress[source].total += config.total;
      progress[source].found += config.found;
      progress[source].new += config.new;
    });
    
    return progress;
  }, [configProgress]);

  // Aggregate totals
  const totalFound = Object.values(sourceProgress).reduce((sum, s) => sum + s.found, 0);
  const totalNew = Object.values(sourceProgress).reduce((sum, s) => sum + s.new, 0);
  const totalLeadsMatched = recentCompleted?.reduce((sum, r: any) => sum + (r.leads_matched || 0), 0) || 0;

  // Calculate elapsed time
  const getElapsedTime = () => {
    if (!runningScans || runningScans.length === 0) return '';
    const earliestStart = new Date(runningScans[0].started_at);
    const now = new Date();
    const diffMs = now.getTime() - earliestStart.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Estimate time remaining based on progress
  const getEstimatedTimeRemaining = () => {
    if (!runningScans || runningScans.length === 0) return '';
    
    const totalConfigs = Object.keys(configProgress).length;
    if (totalConfigs === 0) return '';
    
    const totalPages = totalConfigs * 12;
    const completedPages = Object.values(configProgress).reduce((sum, c) => sum + c.completed, 0);
    const runningPages = Object.values(configProgress).reduce((sum, c) => sum + c.running, 0);
    
    if (completedPages === 0) return '~5 דקות';
    
    const earliestStart = new Date(runningScans[0].started_at);
    const elapsedMs = Date.now() - earliestStart.getTime();
    const msPerPage = elapsedMs / completedPages;
    const remainingPages = totalPages - completedPages - runningPages;
    const remainingMs = remainingPages * msPerPage;
    
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    if (remainingMinutes <= 0) return 'מסיים...';
    return `~${remainingMinutes} דקות`;
  };

  // Overall progress percentage
  const getOverallProgress = () => {
    const totalConfigs = Object.keys(configProgress).length;
    if (totalConfigs === 0) return 0;
    
    const totalPages = totalConfigs * 12;
    const completedPages = Object.values(configProgress).reduce((sum, c) => sum + c.completed, 0);
    
    return Math.min(95, (completedPages / totalPages) * 100);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'yad2':
        return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">יד2</Badge>;
      case 'madlan':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">מדלן</Badge>;
      case 'homeless':
        return <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">הומלס</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  // Show completion summary briefly after scan ends
  if (showCompletionSummary && completionData) {
    return (
      <Card className="p-4 border-2 border-green-500/50 bg-green-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <PartyPopper className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <span className="font-semibold text-green-700 text-lg">סריקה הושלמה!</span>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span><strong>{completionData.total}</strong> נכסים נמצאו</span>
                {completionData.new > 0 && (
                  <Badge className="bg-green-100 text-green-700">{completionData.new} חדשים</Badge>
                )}
                {completionData.matched > 0 && (
                  <Badge className="bg-purple-100 text-purple-700">{completionData.matched} התאמות</Badge>
                )}
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowCompletionSummary(false)}
            className="text-muted-foreground"
          >
            סגור
          </Button>
        </div>
      </Card>
    );
  }

  // Show warning for stuck runs
  if (stuckRuns.length > 0 && !isScanning) {
    return (
      <Card className="p-4 border-2 border-amber-500/50 bg-amber-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="font-medium text-amber-700">
              {stuckRuns.length} ריצות תקועות (יותר מ-10 דקות)
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => clearStuckRunsMutation.mutate()}
            disabled={clearStuckRunsMutation.isPending}
            className="border-amber-500 text-amber-700 hover:bg-amber-500/20"
          >
            {clearStuckRunsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <XCircle className="h-4 w-4 ml-1" />
                נקה ריצות תקועות
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  if (isScanning) {
    // Show stuck runs warning if any
    const hasStuckRuns = stuckRuns.length > 0;
    
    return (
      <Card className={`p-4 border-2 ${hasStuckRuns ? 'border-amber-500/50 bg-amber-500/5' : 'border-primary/30 bg-primary/5'}`}>
        {hasStuckRuns && (
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {stuckRuns.length} ריצות תקועות (יותר מ-10 דקות)
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => clearStuckRunsMutation.mutate()}
              disabled={clearStuckRunsMutation.isPending}
              className="text-amber-700 hover:bg-amber-500/20 h-7 px-2"
            >
              {clearStuckRunsMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'נקה'
              )}
            </Button>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 animate-ping bg-red-500 rounded-full opacity-75" />
              <div className="relative w-3 h-3 bg-red-500 rounded-full" />
            </div>
            <span className="font-semibold text-lg">סריקות פעילות</span>
            <Badge variant="secondary">{Object.keys(configProgress).length} קונפיגורציות</Badge>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{getElapsedTime()}</span>
            </div>
            <div className="text-sm">
              נותרו: <span className="font-medium">{getEstimatedTimeRemaining()}</span>
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mb-4">
          <Progress value={getOverallProgress()} className="h-2" />
        </div>

        {/* Progress per source with individual progress bars */}
        <div className="space-y-3 mb-4">
          {Object.entries(sourceProgress).map(([source, stats]) => {
            const sourceConfigs = Object.values(configProgress).filter(c => c.source === source);
            const totalPages = sourceConfigs.length * 12;
            const completedPages = sourceConfigs.reduce((sum, c) => sum + c.completed, 0);
            const progressPercent = totalPages > 0 ? (completedPages / totalPages) * 100 : 0;
            
            return (
              <div key={source} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSourceBadge(source)}
                    <span className="text-sm font-medium">
                      {completedPages}/{totalPages} דפים
                    </span>
                  </div>
                  <span className="text-sm">
                    <span className="font-semibold">{stats.found}</span> נכסים
                    {stats.new > 0 && (
                      <span className="text-green-600 mr-1"> ({stats.new} חדשים)</span>
                    )}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-green-500" />
            <span>
              סה"כ נמצאו: <span className="font-bold">{totalFound}</span> נכסים
              {totalNew > 0 && (
                <span className="text-green-600 font-semibold mr-1"> ({totalNew} חדשים)</span>
              )}
            </span>
          </div>
          {totalLeadsMatched > 0 && (
            <div className="flex items-center gap-2 text-sm text-purple-600">
              <Users className="h-4 w-4" />
              <span><span className="font-semibold">{totalLeadsMatched}</span> התאמות לידים</span>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // No active scans - show last completed batch (or nothing if completion summary was just shown)
  if (!lastCompletedBatch) {
    return null;
  }

  return (
    <Card className="p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="font-medium">אין סריקות פעילות</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>
            סריקה אחרונה: {formatDistanceToNow(new Date(lastCompletedBatch.completed_at), { locale: he, addSuffix: true })}
            {' - '}
            <span className="font-semibold">{lastCompletedBatch.properties_found}</span> נכסים
          </span>
          {lastCompletedBatch.new_properties > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {lastCompletedBatch.new_properties} חדשים
            </Badge>
          )}
          {lastCompletedBatch.leads_matched > 0 && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {lastCompletedBatch.leads_matched} התאמות
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};
