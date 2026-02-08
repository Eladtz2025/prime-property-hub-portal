import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type BrokerSource = 'all' | 'homeless' | 'madlan' | 'yad2';
export type BrokerMode = 'audit' | 'fix';

interface BackfillProgress {
  id: string;
  task_name: string;
  status: string;
  total_items: number | null;
  processed_items: number | null;
  successful_items: number | null;
  failed_items: number | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string | null;
  error_message: string | null;
  summary_data: Record<string, any> | null;
}

const SOURCE_ORDER: Array<'homeless' | 'madlan' | 'yad2'> = ['homeless', 'madlan', 'yad2'];
const SOURCE_LABELS: Record<string, string> = {
  homeless: 'הומלס',
  madlan: 'מדלן',
  yad2: 'יד2',
};

export const useReclassifyBroker = () => {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [brokerSource, setBrokerSource] = useState<BrokerSource>('all');
  const [brokerMode, setBrokerMode] = useState<BrokerMode>('audit');
  const [brokerBatchSize, setBrokerBatchSize] = useState(200);
  const [runningSource, setRunningSource] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any> | null>(null);
  const [allResults, setAllResults] = useState<Record<string, Record<string, any>>>({});
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  
  // Ref to track if we should auto-advance to next source
  const sequentialQueueRef = useRef<Array<'homeless' | 'madlan' | 'yad2'>>([]);
  const stoppedManuallyRef = useRef(false);

  // Update batch size defaults when mode changes
  useEffect(() => {
    setBrokerBatchSize(brokerMode === 'audit' ? 200 : 100);
  }, [brokerMode]);

  // Get the right task_name for polling
  const taskName = brokerMode === 'audit' ? 'reclassify_broker_audit' : 'reclassify_broker';

  // Poll for progress
  const { data: progress, refetch: refetchProgress } = useQuery({
    queryKey: ['reclassify-progress', taskName, currentTaskId],
    queryFn: async () => {
      if (currentTaskId) {
        const { data, error } = await supabase
          .from('backfill_progress')
          .select('*')
          .eq('id', currentTaskId)
          .single();
        if (error) return null;
        return data as BackfillProgress;
      }
      // Fallback: get latest by task_name
      const { data, error } = await supabase
        .from('backfill_progress')
        .select('*')
        .eq('task_name', taskName)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') return null;
      return data as BackfillProgress | null;
    },
    refetchInterval: isRunning ? 4000 : false,
    enabled: isRunning || !!currentTaskId,
  });

  // Watch progress for completion and sequential advancement
  useEffect(() => {
    if (!progress) return;

    if (progress.status === 'completed' || progress.status === 'stopped' || progress.status === 'failed') {
      if (isRunning) {
        // Save results for this source
        const sourceName = runningSource || (progress.summary_data as any)?._source_filter || 'unknown';
        if (progress.summary_data) {
          setAllResults(prev => ({ ...prev, [sourceName]: progress.summary_data as Record<string, any> }));
          setResults(progress.summary_data as Record<string, any>);
        }

        // Check if we should advance to next source in sequential mode
        const queue = sequentialQueueRef.current;
        if (progress.status === 'completed' && queue.length > 0 && !stoppedManuallyRef.current) {
          const nextSource = queue.shift()!;
          // Start next source after a short delay
          setTimeout(() => startSingleSource(nextSource), 2000);
          return; // Don't set isRunning to false yet
        }

        // All done
        setIsRunning(false);
        setCurrentTaskId(null);
        setRunningSource(null);
        queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
        queryClient.invalidateQueries({ queryKey: ['scouted-properties-stats'] });

        if (progress.status === 'completed') {
          const label = brokerMode === 'audit' ? 'AUDIT' : 'FIX';
          toast.success(`✅ ${label} הושלם!`, { duration: 5000 });
        } else if (progress.status === 'stopped') {
          toast.info('התהליך נעצר');
        } else if (progress.status === 'failed') {
          toast.error(`שגיאה: ${progress.error_message || 'לא ידוע'}`);
        }
      }
    }
  }, [progress?.status, progress?.id]);

  const startSingleSource = useCallback(async (source: 'homeless' | 'madlan' | 'yad2') => {
    setRunningSource(source);
    setIsStarting(true);
    stoppedManuallyRef.current = false;

    try {
      toast.info(`מתחיל ${brokerMode === 'audit' ? 'AUDIT' : 'FIX'} - ${SOURCE_LABELS[source]}...`, { duration: 3000 });
      
      const { data, error } = await supabase.functions.invoke('reclassify-broker', {
        body: {
          action: 'start',
          source_filter: source,
          dry_run: brokerMode === 'audit',
          batch_size: brokerBatchSize,
        }
      });

      if (error) throw error;

      if (data?.task_id) {
        setCurrentTaskId(data.task_id);
        setIsRunning(true);
        refetchProgress();
      } else if (data?.message === 'Already running') {
        setCurrentTaskId(data.task_id);
        setIsRunning(true);
        toast.info('כבר רץ תהליך קיים, עוקב אחריו...');
      }
    } catch (err) {
      console.error('Reclassify start error:', err);
      toast.error('❌ שגיאה בהפעלת התהליך');
      setRunningSource(null);
      // Clear queue on error
      sequentialQueueRef.current = [];
    } finally {
      setIsStarting(false);
    }
  }, [brokerMode, brokerBatchSize, refetchProgress]);

  const start = useCallback(async () => {
    setResults(null);
    setAllResults({});

    if (brokerSource === 'all') {
      // Sequential: homeless → madlan → yad2
      sequentialQueueRef.current = [...SOURCE_ORDER.slice(1)]; // madlan, yad2
      setIsRunning(true);
      await startSingleSource('homeless');
    } else {
      sequentialQueueRef.current = [];
      setIsRunning(true);
      await startSingleSource(brokerSource as 'homeless' | 'madlan' | 'yad2');
    }
  }, [brokerSource, startSingleSource]);

  const stop = useCallback(async () => {
    if (!currentTaskId) return;
    setIsStopping(true);
    stoppedManuallyRef.current = true;
    sequentialQueueRef.current = []; // Clear sequential queue

    try {
      const { error } = await supabase.functions.invoke('reclassify-broker', {
        body: { action: 'stop', task_id: currentTaskId }
      });
      if (error) throw error;
      toast.info('נשלחה בקשת עצירה...');
      refetchProgress();
    } catch (err) {
      console.error('Reclassify stop error:', err);
      toast.error('❌ שגיאה בעצירת התהליך');
    } finally {
      setIsStopping(false);
    }
  }, [currentTaskId, refetchProgress]);

  const percentComplete = progress?.total_items && progress.total_items > 0
    ? Math.round(((progress.processed_items || 0) / progress.total_items) * 100)
    : 0;

  return {
    // State
    isRunning,
    isStarting,
    isStopping,
    progress,
    percentComplete,
    results,
    allResults,
    runningSource,
    // Settings
    brokerSource,
    setBrokerSource,
    brokerMode,
    setBrokerMode,
    brokerBatchSize,
    setBrokerBatchSize,
    // Actions
    start,
    stop,
  };
};
