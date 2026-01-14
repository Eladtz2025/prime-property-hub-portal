import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, Clock, Building2, Sparkles } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface RunningRun {
  id: string;
  source: string;
  status: string;
  properties_found: number | null;
  new_properties: number | null;
  started_at: string;
  scout_configs?: { name: string } | null;
}

interface CompletedRun {
  id: string;
  source: string;
  properties_found: number | null;
  new_properties: number | null;
  completed_at: string;
}

export const LiveScanStatus: React.FC = () => {
  // Query for running scans - refresh every 3 seconds
  const { data: runningScans } = useQuery({
    queryKey: ['running-scans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_runs')
        .select('id, source, status, properties_found, new_properties, started_at, scout_configs(name)')
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
        .select('id, source, status, properties_found, new_properties, completed_at, scout_configs(name)')
        .eq('status', 'completed')
        .gte('completed_at', fiveMinutesAgo)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 3000,
  });

  // Query for last completed scan (for idle state)
  const { data: lastCompleted } = useQuery({
    queryKey: ['last-completed-scan'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_runs')
        .select('id, source, properties_found, new_properties, completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as CompletedRun | null;
    },
    refetchInterval: 10000,
  });

  const isScanning = runningScans && runningScans.length > 0;

  // Group running + recently completed by source to show page progress
  const sourceProgress = React.useMemo(() => {
    const progress: Record<string, { 
      running: number; 
      completed: number; 
      total: number;
      found: number; 
      new: number;
    }> = {};
    
    // Count running scans per source
    runningScans?.forEach(run => {
      const source = run.source;
      if (!progress[source]) {
        progress[source] = { running: 0, completed: 0, total: 12, found: 0, new: 0 };
      }
      progress[source].running += 1;
      progress[source].found += run.properties_found || 0;
      progress[source].new += run.new_properties || 0;
    });
    
    // Count recently completed scans per source (from same batch)
    recentCompleted?.forEach(run => {
      const source = run.source;
      if (!progress[source]) {
        progress[source] = { running: 0, completed: 0, total: 12, found: 0, new: 0 };
      }
      progress[source].completed += 1;
      progress[source].found += run.properties_found || 0;
      progress[source].new += run.new_properties || 0;
    });
    
    return progress;
  }, [runningScans, recentCompleted]);

  // Aggregate totals
  const totalFound = Object.values(sourceProgress).reduce((sum, s) => sum + s.found, 0);
  const totalNew = Object.values(sourceProgress).reduce((sum, s) => sum + s.new, 0);

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

  // Estimate progress (based on typical 5-minute scan)
  const getProgress = () => {
    if (!runningScans || runningScans.length === 0) return 0;
    const earliestStart = new Date(runningScans[0].started_at);
    const now = new Date();
    const diffMs = now.getTime() - earliestStart.getTime();
    const expectedDuration = 5 * 60 * 1000; // 5 minutes
    return Math.min(95, (diffMs / expectedDuration) * 100);
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

  if (isScanning) {
    return (
      <Card className="p-4 border-2 border-primary/30 bg-primary/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 animate-ping bg-red-500 rounded-full opacity-75" />
              <div className="relative w-3 h-3 bg-red-500 rounded-full" />
            </div>
            <span className="font-semibold text-lg">סריקות פעילות ({runningScans?.length})</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{getElapsedTime()}</span>
          </div>
        </div>

        <Progress value={getProgress()} className="h-2 mb-3" />

        <div className="flex flex-wrap items-center gap-4 mb-2">
          {Object.entries(sourceProgress).map(([source, stats]) => (
            <div key={source} className="flex items-center gap-2">
              {getSourceBadge(source)}
              <span className="text-sm">
                <span className="font-semibold">{stats.completed + stats.running}</span>/12 דפים
                {' · '}
                <span className="font-semibold">{stats.found}</span> נכסים
                {stats.new > 0 && (
                  <span className="text-green-600 mr-1">({stats.new} חדשים)</span>
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-green-500" />
          <span>
            סה"כ נמצאו: <span className="font-bold">{totalFound}</span> נכסים
            {totalNew > 0 && (
              <span className="text-green-600 font-semibold mr-1"> ({totalNew} חדשים)</span>
            )}
          </span>
        </div>

      </Card>
    );
  }

  // No active scans - show last completed
  return (
    <Card className="p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="font-medium">אין סריקות פעילות</span>
        </div>
        {lastCompleted && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>
              סריקה אחרונה: {formatDistanceToNow(new Date(lastCompleted.completed_at), { locale: he, addSuffix: true })}
              {' - '}
              <span className="font-medium">{lastCompleted.properties_found}</span> נכסים
              {lastCompleted.new_properties && lastCompleted.new_properties > 0 && (
                <span className="text-green-600"> ({lastCompleted.new_properties} חדשים)</span>
              )}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
