import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import {
  Hourglass, CheckCircle, Timer, Database, Clock, Loader2,
  Copy, Users, Search, Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { LiveMonitor } from './checks/LiveMonitor';
import { ProcessCard } from './checks/ProcessCard';
import { ScheduleSummaryCard } from './ScheduleSummaryCard';
import { ScoutRunHistory } from './ScoutRunHistory';
import { AvailabilityHistorySection } from './checks/AvailabilityHistorySection';
import { DeduplicationStatus } from './checks/DeduplicationStatus';
import { MatchingStatus } from './checks/MatchingStatus';
import { BackfillStatus } from './checks/BackfillStatus';
import { UnifiedScoutSettings } from './UnifiedScoutSettings';
import { useBackfillProgress } from '@/hooks/useBackfillProgress';
import { ScheduleTimeEditor } from './checks/ScheduleTimeEditor';


// Availability settings content for dialog
const AvailabilitySettingsContent: React.FC = () => {
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const queryClient = useQueryClient();

  const { data: availSettings } = useQuery({
    queryKey: ['availability-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('scout_settings').select('*').eq('category', 'availability').order('setting_key');
      if (error) throw error;
      return data;
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ setting_key, setting_value }: { setting_key: string; setting_value: string }) => {
      const { error } = await supabase.from('scout_settings').update({ setting_value }).eq('category', 'availability').eq('setting_key', setting_key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-settings'] });
      toast.success('ההגדרה עודכנה');
      setEditingKey(null);
    },
  });

  const settingLabels: Record<string, string> = {
    batch_size: 'גודל אצווה', concurrency_limit: 'מקביליות', daily_limit: 'מכסה יומית',
    delay_between_batches_ms: 'השהייה בין אצוות (ms)', delay_between_requests_ms: 'השהייה בין בקשות (ms)',
    firecrawl_max_retries: 'ניסיונות Firecrawl', firecrawl_retry_delay_ms: 'השהייה ניסיונות (ms)',
    get_timeout_ms: 'Timeout GET (ms)', head_timeout_ms: 'Timeout HEAD (ms)',
    min_days_before_check: 'ימים לפני בדיקה ראשונה', per_property_timeout_ms: 'Timeout לנכס (ms)',
    recheck_interval_days: 'ימים בין בדיקות',
  };

  if (!availSettings?.length) return <div className="text-center py-6 text-muted-foreground">אין הגדרות</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {availSettings.map(s => (
        <div key={s.id} className="border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{settingLabels[s.setting_key] || s.setting_key}</p>
            {editingKey === s.setting_key ? (
              <div className="flex gap-1">
                <button className="text-xs text-primary" onClick={() => updateSetting.mutate({ setting_key: s.setting_key, setting_value: editValue })}>שמור</button>
                <button className="text-xs text-muted-foreground" onClick={() => setEditingKey(null)}>ביטול</button>
              </div>
            ) : (
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { setEditingKey(s.setting_key); setEditValue(String(s.setting_value)); }}>✏️</button>
            )}
          </div>
          {editingKey === s.setting_key ? (
            <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full h-8 mt-1 text-sm border rounded px-2" dir="ltr" />
          ) : (
            <p className="text-lg font-bold mt-0.5">{String(s.setting_value)}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export const ChecksDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const backfill = useBackfillProgress();

  // Availability stats (including recheck remaining)
  const { data: stats } = useQuery({
    queryKey: ['availability-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const recheckCutoff = new Date();
      recheckCutoff.setDate(recheckCutoff.getDate() - 7);
      const [pendingRes, checkedTodayRes, timeoutRes, totalActiveRes, recheckRes] = await Promise.all([
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).eq('is_active', true).is('availability_checked_at', null),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).gte('availability_checked_at', today.toISOString()),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).eq('availability_check_reason', 'per_property_timeout').eq('is_active', true),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).eq('is_active', true).or(`availability_checked_at.is.null,availability_checked_at.lt.${recheckCutoff.toISOString()}`),
      ]);
      return { pending: pendingRes.count ?? 0, checkedToday: checkedTodayRes.count ?? 0, timeouts: timeoutRes.count ?? 0, totalActive: totalActiveRes.count ?? 0, pendingRecheck: recheckRes.count ?? 0 };
    },
    refetchInterval: 15000,
  });

  // Backfill remaining count
  const { data: backfillRemaining } = useQuery({
    queryKey: ['backfill-remaining'],
    queryFn: async () => {
      const { count } = await supabase
        .from('scouted_properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .or('backfill_status.is.null,backfill_status.eq.failed');
      return count ?? 0;
    },
    refetchInterval: 15000,
  });

  // Eligible leads count for matching
  const { data: eligibleLeads } = useQuery({
    queryKey: ['eligible-leads-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('contact_leads')
        .select('id', { count: 'exact', head: true })
        .eq('matching_status', 'eligible');
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  // Active scan configs count
  const { data: activeConfigs } = useQuery({
    queryKey: ['active-configs-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('scout_configs')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      return count ?? 0;
    },
    refetchInterval: 60000,
  });

  // Last availability run
  const { data: lastAvailRun } = useQuery({
    queryKey: ['availability-last-run'],
    queryFn: async () => {
      const { data } = await supabase.from('availability_check_runs').select('started_at, completed_at, status, properties_checked, inactive_marked').order('started_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    refetchInterval: 10000,
  });

  // Last scan run
  const { data: lastScanRun } = useQuery({
    queryKey: ['scan-last-run'],
    queryFn: async () => {
      const { data } = await supabase.from('scout_runs').select('started_at, completed_at, status, properties_found, new_properties, source').order('started_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    refetchInterval: 10000,
  });

  // Dedup stats
  const { data: dedupStats } = useQuery({
    queryKey: ['dedup-stats-summary'],
    queryFn: async () => {
      const [unresolvedRes, todayRes] = await Promise.all([
        supabase.from('duplicate_alerts').select('id', { count: 'exact', head: true }).eq('is_resolved', false),
        supabase.from('duplicate_alerts').select('id', { count: 'exact', head: true }).gte('detected_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
      ]);
      return { unresolved: unresolvedRes.count ?? 0, today: todayRes.count ?? 0 };
    },
    refetchInterval: 30000,
  });

  // Matching stats
  const { data: matchStats } = useQuery({
    queryKey: ['matching-stats-summary'],
    queryFn: async () => {
      const { data } = await supabase.from('personal_scout_runs').select('total_matches, completed_at, leads_count, status').order('created_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    refetchInterval: 30000,
  });

  // Trigger availability
  const triggerAvailability = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('trigger-availability-check');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`בדיקת זמינות הופעלה: ${data?.message || ''}`);
      queryClient.invalidateQueries({ queryKey: ['availability-stats'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Trigger matching
  const triggerMatching = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('personal-scout');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('התאמות הופעלו');
      queryClient.invalidateQueries({ queryKey: ['matching-stats-summary'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Trigger dedup
  const triggerDedup = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('detect-duplicates');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('בדיקת כפילויות הופעלה');
      queryClient.invalidateQueries({ queryKey: ['dedup-stats-summary'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const isAvailRunning = lastAvailRun?.status === 'running';
  const isScanRunning = lastScanRun?.status === 'running';
  const isMatchRunning = matchStats?.status === 'running';

  const formatDuration = (started: string, completed: string | null) => {
    if (!completed) return 'רץ...';
    const secs = Math.round((new Date(completed).getTime() - new Date(started).getTime()) / 1000);
    return secs < 60 ? `${secs} שניות` : `${Math.round(secs / 60)} דקות`;
  };

  const formatLastRun = (started?: string, completed?: string | null) => {
    if (!started) return undefined;
    const date = format(new Date(started), 'dd/MM HH:mm', { locale: he });
    const duration = completed ? formatDuration(started, completed) : 'רץ...';
    return `${date} (${duration})`;
  };

  return (
    <div className="space-y-4" dir="rtl">

      {/* Live Monitor */}
      <LiveMonitor />

      {/* Process Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Scans */}
        <ProcessCard
          title="סריקות"
          icon={<Search className="h-4 w-4 text-orange-600" />}
          iconColor="bg-orange-100 dark:bg-orange-900/30"
          status={isScanRunning ? 'running' : lastScanRun ? 'completed' : 'idle'}
          statusText={isScanRunning ? 'סריקה פעילה...' : lastScanRun ? `${lastScanRun.properties_found ?? 0} נמצאו, ${lastScanRun.new_properties ?? 0} חדשים` : 'לא הופעל'}
          metrics={[
            { label: 'מקור', value: lastScanRun?.source || '—' },
            { label: 'נמצאו', value: lastScanRun?.properties_found ?? 0 },
            { label: 'configs פעילים', value: activeConfigs ?? 0 },
          ]}
          lastRun={formatLastRun(lastScanRun?.started_at, lastScanRun?.completed_at)}
          historyContent={<ScoutRunHistory />}
          settingsContent={<UnifiedScoutSettings />}
          historyTitle="היסטוריית סריקות"
          settingsTitle="הגדרות סריקה"
        />

        {/* Availability */}
        <ProcessCard
          title="בדיקת זמינות"
          icon={<Shield className="h-4 w-4 text-blue-600" />}
          iconColor="bg-blue-100 dark:bg-blue-900/30"
          status={isAvailRunning ? 'running' : lastAvailRun ? 'completed' : 'idle'}
          statusText={isAvailRunning ? 'בודק זמינות...' : lastAvailRun ? `${lastAvailRun.properties_checked ?? 0} נבדקו, ${lastAvailRun.inactive_marked ?? 0} הוסרו` : 'לא הופעל'}
          metrics={[
            { label: 'נותרו', value: stats?.pendingRecheck ?? 0 },
            { label: 'נבדקו היום', value: stats?.checkedToday ?? 0 },
            { label: 'Timeouts', value: stats?.timeouts ?? 0 },
          ]}
          lastRun={formatLastRun(lastAvailRun?.started_at, lastAvailRun?.completed_at)}
          onRun={() => triggerAvailability.mutate()}
          isRunPending={triggerAvailability.isPending}
          historyContent={<AvailabilityHistorySection />}
          settingsContent={
            <div className="space-y-6">
              <ScheduleTimeEditor
                category="availability"
                cronJobNames={[{ jobName: 'availability-check-continuous', cronTemplate: (h, m) => `${m} ${h} * * *` }]}
                label="שעות ריצת בדיקת זמינות"
              />
              <AvailabilitySettingsContent />
            </div>
          }
          historyTitle="היסטוריית בדיקות זמינות"
          settingsTitle="הגדרות בדיקת זמינות"
        />

        {/* Dedup */}
        <ProcessCard
          title="כפילויות"
          icon={<Copy className="h-4 w-4 text-purple-600" />}
          iconColor="bg-purple-100 dark:bg-purple-900/30"
          status={dedupStats?.unresolved ? 'completed' : 'idle'}
          statusText={`${dedupStats?.unresolved ?? 0} לא טופלו`}
          metrics={[
            { label: 'נותרו', value: dedupStats?.unresolved ?? 0 },
            { label: 'היום', value: dedupStats?.today ?? 0 },
          ]}
          onRun={() => triggerDedup.mutate()}
          isRunPending={triggerDedup.isPending}
          historyContent={<DeduplicationStatus />}
          settingsContent={
            <ScheduleTimeEditor
              category="duplicates"
              cronJobNames={[{ jobName: 'cleanup-orphan-duplicates-hourly', cronTemplate: (h, m) => `${m} ${h} * * *` }]}
              label="שעות ריצת ניקוי כפילויות"
            />
          }
          historyTitle="כפילויות"
          settingsTitle="הגדרות כפילויות"
        />

        {/* Matching */}
        <ProcessCard
          title="התאמות"
          icon={<Users className="h-4 w-4 text-green-600" />}
          iconColor="bg-green-100 dark:bg-green-900/30"
          status={isMatchRunning ? 'running' : matchStats ? 'completed' : 'idle'}
          statusText={isMatchRunning ? 'מחפש התאמות...' : matchStats ? `${matchStats.total_matches ?? 0} התאמות` : 'לא הופעל'}
          metrics={[
            { label: 'לידים eligible', value: eligibleLeads ?? 0 },
            { label: 'התאמות', value: matchStats?.total_matches ?? 0 },
          ]}
          lastRun={matchStats?.completed_at ? format(new Date(matchStats.completed_at), 'dd/MM HH:mm', { locale: he }) : undefined}
          onRun={() => triggerMatching.mutate()}
          isRunPending={triggerMatching.isPending}
          historyContent={<MatchingStatus />}
          settingsContent={
            <ScheduleTimeEditor
              category="matching"
              cronJobNames={[{ jobName: 'match-leads-job', cronTemplate: (h, m) => `${m} ${h} * * *` }]}
              label="שעות ריצת התאמות"
            />
          }
          historyTitle="היסטוריית התאמות"
          settingsTitle="הגדרות התאמות"
        />

        {/* Backfill */}
        <ProcessCard
          title="השלמת נתונים"
          icon={<Database className="h-4 w-4 text-emerald-600" />}
          iconColor="bg-emerald-100 dark:bg-emerald-900/30"
          status={backfill.isRunning ? 'running' : backfill.progress?.status === 'completed' ? 'completed' : 'idle'}
          statusText={backfill.isRunning ? `${backfill.progress?.processed_items ?? 0}/${backfill.progress?.total_items ?? '?'}` : backfill.progress?.status === 'completed' ? 'הושלם' : 'לא הופעל'}
          metrics={[
            { label: 'נותרו', value: backfillRemaining ?? 0 },
            { label: 'הצלחות', value: backfill.progress?.successful_items ?? 0 },
            { label: 'כשלונות', value: backfill.progress?.failed_items ?? 0 },
          ]}
          onRun={backfill.start}
          onStop={backfill.stop}
          isRunPending={backfill.isStarting}
          isStopPending={backfill.isStopping}
          historyContent={<BackfillStatus />}
          settingsContent={
            <ScheduleTimeEditor
              category="backfill"
              cronJobNames={[{ jobName: 'backfill-data-completion-job', cronTemplate: (h, m) => `${m} ${h} * * *` }]}
              label="שעות ריצת השלמת נתונים"
            />
          }
          historyTitle="היסטוריית השלמת נתונים"
          settingsTitle="הגדרות השלמת נתונים"
        />
      </div>

      {/* Schedule Summary */}
      <ScheduleSummaryCard />
    </div>
  );
};
