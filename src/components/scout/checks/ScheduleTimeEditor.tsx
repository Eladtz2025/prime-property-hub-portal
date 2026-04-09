import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useScoutSettings } from '@/hooks/useScoutSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface ScheduleTimeEditorProps {
  category: string;
  cronJobNames: { jobName: string; cronTemplate: (utcHour: number, utcMinute: number) => string }[];
  label?: string;
  showEndTime?: boolean;
}

const IL_UTC_OFFSET = 2; // Israel is UTC+2 (winter) / UTC+3 (summer) — using +2 as base

function ilTimeToUtc(ilTime: string): { hour: number; minute: number } {
  const [h, m] = ilTime.split(':').map(Number);
  let utcHour = h - IL_UTC_OFFSET;
  if (utcHour < 0) utcHour += 24;
  return { hour: utcHour, minute: m };
}

export const ScheduleTimeEditor: React.FC<ScheduleTimeEditorProps> = ({
  category,
  cronJobNames,
  label = 'שעות ריצה (שעון ישראל)',
  showEndTime = false,
}) => {
  const { data: settings } = useScoutSettings();
  const queryClient = useQueryClient();
  const [times, setTimes] = useState<string[]>([]);
  const [endTime, setEndTime] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  // Load current times from settings
  useEffect(() => {
    if (!settings) return;
    const cat = settings[category as keyof typeof settings] as any;
    if (cat?.schedule_times) {
      setTimes([...cat.schedule_times]);
    }
    if (cat?.schedule_end_time) {
      setEndTime(cat.schedule_end_time);
    }
    setHasChanges(false);
  }, [settings, category]);

  const saveMutation = useMutation({
    mutationFn: async (params: { newTimes: string[]; newEndTime?: string }) => {
      // 1. Update schedule_times
      const { error: settingsError } = await supabase
        .from('scout_settings')
        .update({ setting_value: JSON.stringify(params.newTimes) })
        .eq('category', category)
        .eq('setting_key', 'schedule_times');

      if (settingsError) throw settingsError;

      // 2. Update schedule_end_time if provided
      if (params.newEndTime !== undefined) {
        const { error: endTimeError } = await supabase
          .from('scout_settings')
          .update({ setting_value: params.newEndTime })
          .eq('category', category)
          .eq('setting_key', 'schedule_end_time');

        if (endTimeError) throw endTimeError;
      }

      // 3. Update cron jobs - use first time for single-cron jobs
      for (const { jobName, cronTemplate } of cronJobNames) {
        const primaryTime = params.newTimes[0] || '00:00';
        const { hour, minute } = ilTimeToUtc(primaryTime);
        const cronExpr = cronTemplate(hour, minute);

        const { error: cronError } = await supabase.rpc('update_cron_schedule', {
          p_job_name: jobName,
          p_new_schedule: cronExpr,
        });

        if (cronError) {
          logger.warn(`Failed to update cron ${jobName}:`, cronError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scout-settings'] });
      queryClient.invalidateQueries({ queryKey: ['scout-settings-raw'] });
      toast.success('שעות הריצה עודכנו בהצלחה');
      setHasChanges(false);
    },
    onError: (err: any) => {
      toast.error(`שגיאה בעדכון: ${err.message}`);
    },
  });

  const updateTime = (index: number, value: string) => {
    const updated = [...times];
    updated[index] = value;
    setTimes(updated);
    setHasChanges(true);
  };

  const addTime = () => {
    setTimes([...times, '12:00']);
    setHasChanges(true);
  };

  const removeTime = (index: number) => {
    if (times.length <= 1) return;
    setTimes(times.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>

      <div className="space-y-2">
        {times.map((time, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="time"
              value={time}
              onChange={(e) => updateTime(index, e.target.value)}
              className="w-32 h-8 text-sm"
              dir="ltr"
            />
            {showEndTime && index === 0 && (
              <>
                <span className="text-xs text-muted-foreground">עד</span>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => { setEndTime(e.target.value); setHasChanges(true); }}
                  className="w-32 h-8 text-sm"
                  dir="ltr"
                />
              </>
            )}
            {times.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => removeTime(index)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addTime}>
          <Plus className="h-3 w-3" />
          הוסף שעה
        </Button>

        {hasChanges && (
          <Button
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => saveMutation.mutate({ newTimes: times, newEndTime: showEndTime ? endTime : undefined })}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            שמור
          </Button>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">
        השעות מוצגות בשעון ישראל. השינוי מעדכן גם את ה-Cron Job בשרת.
      </p>
    </div>
  );
};
