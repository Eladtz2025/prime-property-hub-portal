import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { ChevronDown, Zap, Play, RotateCcw, Search, Loader2 } from 'lucide-react';

export const AvailabilityActions: React.FC = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['availability-runs'] });
    queryClient.invalidateQueries({ queryKey: ['availability-stats'] });
    queryClient.invalidateQueries({ queryKey: ['availability-results'] });
    queryClient.invalidateQueries({ queryKey: ['availability-breakdown'] });
    queryClient.invalidateQueries({ queryKey: ['availability-timeline'] });
  };

  const triggerRunMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('trigger-availability-check');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`ריצה הופעלה: ${data?.message || 'בדיקה התחילה'}`);
      invalidateAll();
    },
    onError: (err: any) => toast.error(`שגיאה: ${err.message}`),
  });

  const resetTimeoutsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('scouted_properties')
        .update({ 
          availability_checked_at: null,
          availability_check_reason: null 
        })
        .eq('availability_check_reason', 'per_property_timeout')
        .eq('is_active', true)
        .select('id');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`אופסו ${data?.length || 0} נכסי Timeout`);
      invalidateAll();
    },
    onError: (err: any) => toast.error(`שגיאה: ${err.message}`),
  });

  const checkUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      // Find property by URL
      const { data: props, error: findErr } = await supabase
        .from('scouted_properties')
        .select('id')
        .eq('source_url', url)
        .limit(1);
      if (findErr) throw findErr;
      if (!props?.length) throw new Error('לא נמצא נכס עם URL זה');

      const { data, error } = await supabase.functions.invoke('check-property-availability', {
        body: { property_ids: [props[0].id] },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const result = data?.results?.[0];
      toast.success(
        result 
          ? `תוצאה: ${result.reason} ${result.isInactive ? '(לא אקטיבי)' : '(אקטיבי)'}`
          : 'בדיקה הושלמה'
      );
      setUrlInput('');
      invalidateAll();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const isAnyLoading = triggerRunMutation.isPending || resetTimeoutsMutation.isPending || checkUrlMutation.isPending;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4" />
                פעולות מהירות
              </CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => triggerRunMutation.mutate()}
                disabled={isAnyLoading}
              >
                {triggerRunMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                הפעל ריצה עכשיו
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1"
                onClick={() => resetTimeoutsMutation.mutate()}
                disabled={isAnyLoading}
              >
                {resetTimeoutsMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                אפס Timeouts
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="הכנס URL של נכס לבדיקה..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="h-8 text-xs"
                dir="ltr"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1 shrink-0"
                onClick={() => urlInput && checkUrlMutation.mutate(urlInput)}
                disabled={!urlInput || isAnyLoading}
              >
                {checkUrlMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                בדוק
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
