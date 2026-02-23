import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BackfillProgress {
  id: string;
  task_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
  total_items: number | null;
  processed_items: number | null;
  successful_items: number | null;
  failed_items: number | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string | null;
  error_message: string | null;
}

export const useBackfillProgress = () => {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // Query for current progress
  const { data: progress, refetch: refetchProgress } = useQuery({
    queryKey: ['backfill-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backfill_progress')
        .select('*')
        .eq('task_name', 'data_completion')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as BackfillProgress | null;
    },
    refetchInterval: isRunning ? 3000 : false,
  });

  // Update running state based on progress
  useEffect(() => {
    if (progress?.status === 'running') {
      setIsRunning(true);
      setCurrentTaskId(progress.id);
    } else if (progress?.status === 'completed' || progress?.status === 'stopped' || progress?.status === 'failed') {
      if (isRunning) {
        // Just finished
        setIsRunning(false);
        queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
        queryClient.invalidateQueries({ queryKey: ['scouted-properties-stats'] });
        
        if (progress.status === 'completed') {
          toast.success(
            `✅ הושלם! עודכנו: ${progress.successful_items || 0} | נכשלו: ${progress.failed_items || 0}`,
            { duration: 8000 }
          );
        } else if (progress.status === 'stopped') {
          toast.info('השלמת הנתונים נעצרה');
        }
      }
      setCurrentTaskId(null);
    }
  }, [progress?.status, progress?.id, isRunning, queryClient]);

  // Start backfill mutation
  const startMutation = useMutation({
    mutationFn: async () => {
      toast.info('מתחיל השלמת נתונים...', { duration: 3000 });
      // Fire-and-forget - don't await the full batch
      supabase.functions.invoke('backfill-property-data', {
        body: { action: 'start', dry_run: false }
      }).catch(err => console.error('Backfill error:', err));
      return { fired: true };
    },
    onSuccess: () => {
      setIsRunning(true);
      setTimeout(() => refetchProgress(), 2000);
    },
    onError: (error) => {
      console.error('Backfill start error:', error);
      toast.error('❌ שגיאה בהפעלת השלמת נתונים');
    }
  });

  // Stop backfill mutation
  const stopMutation = useMutation({
    mutationFn: async () => {
      if (!currentTaskId) throw new Error('No task to stop');
      const { data, error } = await supabase.functions.invoke('backfill-property-data', {
        body: { action: 'stop', task_id: currentTaskId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setIsRunning(false);
      refetchProgress();
    },
    onError: (error) => {
      console.error('Backfill stop error:', error);
      toast.error('❌ שגיאה בעצירת התהליך');
    }
  });

  const start = useCallback(() => {
    startMutation.mutate();
  }, [startMutation]);

  const stop = useCallback(() => {
    stopMutation.mutate();
  }, [stopMutation]);

  const percentComplete = progress?.total_items && progress.total_items > 0
    ? Math.round(((progress.processed_items || 0) / progress.total_items) * 100)
    : 0;

  return {
    isRunning,
    progress,
    percentComplete,
    start,
    stop,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
  };
};
