import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useScoutSettings } from '@/hooks/useScoutSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const PhoneWindowEditor: React.FC = () => {
  const { data: settings } = useScoutSettings();
  const queryClient = useQueryClient();
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('21:00');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!settings?.phoneExtraction) return;
    setStartTime(settings.phoneExtraction.window_start || '09:00');
    setEndTime(settings.phoneExtraction.window_end || '21:00');
    setHasChanges(false);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const [r1, r2] = await Promise.all([
        supabase.from('scout_settings')
          .update({ setting_value: startTime })
          .eq('category', 'phoneExtraction')
          .eq('setting_key', 'window_start'),
        supabase.from('scout_settings')
          .update({ setting_value: endTime })
          .eq('category', 'phoneExtraction')
          .eq('setting_key', 'window_end'),
      ]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scout-settings'] });
      toast.success('חלון הפעולה עודכן');
      setHasChanges(false);
    },
    onError: (err: any) => {
      toast.error(`שגיאה: ${err.message}`);
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">חלון פעילות (שעון ישראל)</span>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">מ–</span>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => { setStartTime(e.target.value); setHasChanges(true); }}
            className="w-28 h-8 text-sm"
            dir="ltr"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">עד</span>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => { setEndTime(e.target.value); setHasChanges(true); }}
            className="w-28 h-8 text-sm"
            dir="ltr"
          />
        </div>
        {hasChanges && (
          <Button
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Save className="h-3 w-3" />}
            שמור
          </Button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        הפונקציה בודקת את השעה הנוכחית לפי ערכים אלו בכל הפעלה. הקרון רץ 06:00–23:00 UTC ומכסה כל חלון סביר.
      </p>
    </div>
  );
};
