import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

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

export const useBackfillProgressJina = () => {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const { data: progress, refetch: refetchProgress } = useQuery({
    queryKey: ['backfill-progress-jina'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backfill_progress')
        .select('*')
        .eq('task_name', 'data_completion_jina')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as BackfillProgress | null;
    },
    refetchInterval: isRunning ? 3000 : false,
  });

  useEffect(() => {
    if (progress?.status === 'running') {
      setIsRunning(true);
      setCurrentTaskId(progress.id);
    } else if (progress?.status === 'completed' || progress?.status === 'stopped' || progress?.status === 'failed') {
      if (isRunning) {
        setIsRunning(false);
        queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
        queryClient.invalidateQueries({ queryKey: ['scouted-properties-stats'] });
        
        if (progress.status === 'completed') {
          toast.success(
            `✅ Jina הושלם! עודכנו: ${progress.successful_items || 0} | נכשלו: ${progress.failed_items || 0}`,
            { duration: 8000 }
          );
        } else if (progress.status === 'stopped') {
          toast.info('השלמת נתונים (Jina) נעצרה');
        }
      }
      setCurrentTaskId(null);
    }
  }, [progress?.status, progress?.id, isRunning, queryClient]);

  const startMutation = useMutation({
    mutationFn: async () => {
      toast.info('מתחיל השלמת נתונים (Jina)...', { duration: 3000 });
      // Fire-and-forget - don't await the full batch
      supabase.functions.invoke('backfill-property-data-jina', {
        body: { action: 'start', dry_run: false }
      }).catch(err => logger.error('Backfill Jina error:', err));
      return { fired: true };
    },
    onSuccess: () => {
      setIsRunning(true);
      setTimeout(() => refetchProgress(), 2000);
    },
    onError: (error) => {
      logger.error('Backfill Jina start error:', error);
      toast.error('❌ שגיאה בהפעלת השלמת נתונים (Jina)');
    }
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      if (!currentTaskId) throw new Error('No task to stop');
      const { data, error } = await supabase.functions.invoke('backfill-property-data-jina', {
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
      logger.error('Backfill Jina stop error:', error);
      toast.error('❌ שגיאה בעצירת התהליך (Jina)');
    }
  });

  // Count of failed properties (so the user can retry them)
  const { data: failedCount = 0, refetch: refetchFailedCount } = useQuery({
    queryKey: ['backfill-jina-failed-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('scouted_properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('backfill_status', 'failed');
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: isRunning ? 5000 : 30000,
  });

  const retryFailedMutation = useMutation({
    mutationFn: async () => {
      toast.info('מאפס נכסים שנכשלו...', { duration: 3000 });
      const { data, error } = await supabase.functions.invoke('backfill-property-data-jina', {
        body: { action: 'reset', source_filter: 'all', only_failed: true }
      });
      if (error) throw error;
      return data as { success: boolean; reset_count: number };
    },
    onSuccess: (data) => {
      toast.success(`✅ אופסו ${data?.reset_count ?? 0} נכסים — מתחיל השלמה...`);
      refetchFailedCount();
      // Fire-and-forget start
      supabase.functions.invoke('backfill-property-data-jina', {
        body: { action: 'start', dry_run: false }
      }).catch(err => logger.error('Backfill Jina start after reset error:', err));
      setIsRunning(true);
      setTimeout(() => refetchProgress(), 2000);
    },
    onError: (error) => {
      logger.error('Backfill Jina retry-failed error:', error);
      toast.error('❌ שגיאה באיפוס נכשלים');
    }
  });

  const start = useCallback(() => {
    startMutation.mutate();
  }, [startMutation]);

  const stop = useCallback(() => {
    stopMutation.mutate();
  }, [stopMutation]);

  const retryFailed = useCallback(() => {
    retryFailedMutation.mutate();
  }, [retryFailedMutation]);

  const percentComplete = progress?.total_items && progress.total_items > 0
    ? Math.round(((progress.processed_items || 0) / progress.total_items) * 100)
    : 0;

  return {
    isRunning,
    progress,
    percentComplete,
    start,
    stop,
    retryFailed,
    failedCount,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
    isRetryingFailed: retryFailedMutation.isPending,
  };
};
