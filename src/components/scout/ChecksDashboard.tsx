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
import { BackfillJinaHistory } from './checks/BackfillJinaHistory';
import { UnifiedScoutSettings } from './UnifiedScoutSettings';
import { useBackfillProgress } from '@/hooks/useBackfillProgress';
import { useBackfillProgressJina } from '@/hooks/useBackfillProgressJina';
import { ScheduleTimeEditor } from './checks/ScheduleTimeEditor';


// Logic description component
const LogicDescription: React.FC<{ lines: string[] }> = ({ lines }) => (
  <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed border">
    <p className="font-medium text-foreground mb-1.5 text-sm">איך זה עובד?</p>
    <ul className="space-y-1 list-disc list-inside">
      {lines.map((line, i) => <li key={i}>{line}</li>)}
    </ul>
  </div>
);

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
    recheck_interval_days: 'ימים בין בדיקות (ישן)',
    first_recheck_interval_days: 'ימים עד recheck ראשון',
    recurring_recheck_interval_days: 'ימים בין rechecks חוזרים',
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
  const backfillJina = useBackfillProgressJina();

  // Process kill switches (feature flags)
  const { data: processFlags } = useQuery({
    queryKey: ['process-flags'],
    queryFn: async () => {
      const { data } = await supabase
        .from('feature_flags')
        .select('name, is_enabled')
        .in('name', ['process_scans', 'process_availability', 'process_duplicates', 'process_matching', 'process_backfill', 'process_availability_jina', 'process_backfill_jina', 'process_scans_jina']);
      const flags: Record<string, boolean> = {};
      data?.forEach(f => { flags[f.name] = f.is_enabled ?? true; });
      return flags;
    },
    refetchInterval: 30000,
  });

  const toggleFlag = useMutation({
    mutationFn: async ({ name, enabled }: { name: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
        .eq('name', name);
      if (error) throw error;
    },
    onSuccess: (_, { name, enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['process-flags'] });
      toast.success(enabled ? 'התהליך הופעל' : 'התהליך כובה');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Availability stats (unique key to avoid collision with global stats)
  const { data: stats } = useQuery({
    queryKey: ['dashboard-availability-detail'],
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
        supabase.rpc('get_properties_needing_availability_check', {
          p_first_recheck_days: 8,
          p_recurring_recheck_days: 2,
          p_min_days_before_check: 3,
          p_fetch_limit: 10000
        }),
      ]);
      return { pending: pendingRes.count ?? 0, checkedToday: checkedTodayRes.count ?? 0, timeouts: timeoutRes.count ?? 0, totalActive: totalActiveRes.count ?? 0, pendingRecheck: recheckRes.data?.length ?? 0 };
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

  // Eligible & ineligible leads count for matching
  const { data: leadCounts } = useQuery({
    queryKey: ['lead-eligibility-counts'],
    queryFn: async () => {
      const [eligibleRes, ineligibleRes] = await Promise.all([
        supabase.from('contact_leads').select('id', { count: 'exact', head: true }).eq('matching_status', 'eligible'),
        supabase.from('contact_leads').select('id', { count: 'exact', head: true }).eq('matching_status', 'incomplete'),
      ]);
      return { eligible: eligibleRes.count ?? 0, ineligible: ineligibleRes.count ?? 0 };
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

  // Last scan run (firecrawl or legacy null)
  const { data: lastScanRun } = useQuery({
    queryKey: ['scan-last-run'],
    queryFn: async () => {
      const { data } = await (supabase.from('scout_runs').select('started_at, completed_at, status, properties_found, new_properties, source') as any).or('scanner.is.null,scanner.eq.firecrawl').order('started_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    refetchInterval: 10000,
  });

  // Last scan run (Jina)
  const { data: lastScanRunJina } = useQuery({
    queryKey: ['scan-last-run-jina'],
    queryFn: async () => {
      const { data } = await (supabase.from('scout_runs').select('started_at, completed_at, status, properties_found, new_properties, source') as any).eq('scanner', 'jina').order('started_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    refetchInterval: 10000,
  });

  // Dedup stats — read from scouted_properties + backfill_progress for accurate counts
  const { data: dedupStats } = useQuery({
    queryKey: ['dedup-stats-summary'],
    queryFn: async () => {
      const [totalActiveRes, checkedRes, uncheckedRes, lastRunRes] = await Promise.all([
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).eq('is_active', true).not('dedup_checked_at', 'is', null),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).eq('is_active', true).is('dedup_checked_at', null),
        supabase.from('backfill_progress').select('*').eq('task_name', 'dedup-scan').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      return {
        totalActive: totalActiveRes.count ?? 0,
        checked: checkedRes.count ?? 0,
        unchecked: uncheckedRes.count ?? 0,
        lastRun: lastRunRes.data,
      };
    },
    refetchInterval: 15000,
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
      const { data, error } = await supabase.functions.invoke('trigger-availability-check', { body: { manual: true } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`בדיקת זמינות הופעלה: ${data?.message || ''}`);
      queryClient.invalidateQueries({ queryKey: ['dashboard-availability-detail'] });
      queryClient.invalidateQueries({ queryKey: ['global-scout-stats'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Stop availability
  const stopAvailability = useMutation({
    mutationFn: async () => {
      // Stop running runs
      const { error: e1 } = await supabase
        .from('availability_check_runs')
        .update({ status: 'stopped', completed_at: new Date().toISOString() })
        .eq('status', 'running');
      if (e1) throw e1;
      // Also stop recently completed runs to prevent self-chain
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      await supabase
        .from('availability_check_runs')
        .update({ status: 'stopped' })
        .eq('status', 'completed')
        .gte('completed_at', fiveMinAgo);
    },
    onSuccess: () => {
      toast.success('בדיקת זמינות נעצרה');
      queryClient.invalidateQueries({ queryKey: ['availability-last-run'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-availability-detail'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Trigger availability Jina
  const triggerAvailabilityJina = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('trigger-availability-check-jina', { body: { manual: true } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`בדיקת זמינות (Jina) הופעלה: ${data?.message || ''}`);
      queryClient.invalidateQueries({ queryKey: ['dashboard-availability-detail'] });
      queryClient.invalidateQueries({ queryKey: ['global-scout-stats'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Stop availability Jina
  const stopAvailabilityJina = useMutation({
    mutationFn: async () => {
      const { error: e1 } = await supabase
        .from('availability_check_runs')
        .update({ status: 'stopped', completed_at: new Date().toISOString() })
        .eq('status', 'running');
      if (e1) throw e1;
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      await supabase
        .from('availability_check_runs')
        .update({ status: 'stopped' })
        .eq('status', 'completed')
        .gte('completed_at', fiveMinAgo);
    },
    onSuccess: () => {
      toast.success('בדיקת זמינות (Jina) נעצרה');
      queryClient.invalidateQueries({ queryKey: ['availability-last-run'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-availability-detail'] });
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
      const { data, error } = await supabase.functions.invoke('detect-duplicates', {
        body: { reset: true }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('בדיקת כפילויות הופעלה');
      queryClient.invalidateQueries({ queryKey: ['dedup-stats-summary'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Trigger scans Jina
  const triggerScansJina = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('trigger-scout-all-jina');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('סריקות Jina הופעלו');
      queryClient.invalidateQueries({ queryKey: ['scan-last-run-jina'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Stop scans Jina
  const stopScansJina = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase
        .from('scout_runs')
        .update({ status: 'stopped', completed_at: new Date().toISOString(), error_message: 'הופסק ידנית' } as any)
        .eq('status', 'running') as any)
        .eq('scanner', 'jina');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('סריקות Jina נעצרו');
      queryClient.invalidateQueries({ queryKey: ['scan-last-run-jina'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const isAvailRunning = lastAvailRun?.status === 'running';
  const isScanRunning = lastScanRun?.status === 'running';
  const isScanJinaRunning = lastScanRunJina?.status === 'running';
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
          enabled={processFlags?.process_scans ?? true}
          onToggleEnabled={(v) => toggleFlag.mutate({ name: 'process_scans', enabled: v })}
          isTogglePending={toggleFlag.isPending}
        />

        {/* Scans Jina */}
        <ProcessCard
          title="סריקות 2 (Jina)"
          icon={<Search className="h-4 w-4 text-teal-600" />}
          iconColor="bg-teal-100 dark:bg-teal-900/30"
          status={isScanJinaRunning ? 'running' : lastScanRunJina ? 'completed' : 'idle'}
          statusText={isScanJinaRunning ? 'סריקה פעילה (Jina)...' : lastScanRunJina ? `${lastScanRunJina.properties_found ?? 0} נמצאו, ${lastScanRunJina.new_properties ?? 0} חדשים` : 'לא הופעל'}
          metrics={[
            { label: 'מקור', value: lastScanRunJina?.source || '—' },
            { label: 'נמצאו', value: lastScanRunJina?.properties_found ?? 0 },
            { label: 'configs פעילים', value: activeConfigs ?? 0 },
          ]}
          lastRun={formatLastRun(lastScanRunJina?.started_at, lastScanRunJina?.completed_at)}
          onRun={() => triggerScansJina.mutate()}
          onStop={() => stopScansJina.mutate()}
          isRunPending={triggerScansJina.isPending}
          isStopPending={stopScansJina.isPending}
          historyContent={<ScoutRunHistory />}
          settingsContent={
            <div className="space-y-6">
              <LogicDescription lines={[
                'אותה מערכת סריקות כמו המקורית, אבל עם Jina AI Reader במקום Firecrawl.',
                'תומכת בכל 3 המקורות: יד2, מדלן, הומלס.',
                'הומלס מקבל HTML מ-Jina (X-Return-Format: html) לתאימות עם הפרסר הקיים.',
              ]} />
              <UnifiedScoutSettings triggerFunction="trigger-scout-pages-jina" />
            </div>
          }
          historyTitle="היסטוריית סריקות (Jina)"
          settingsTitle="הגדרות סריקות (Jina)"
          enabled={processFlags?.process_scans_jina ?? true}
          onToggleEnabled={(v) => toggleFlag.mutate({ name: 'process_scans_jina', enabled: v })}
          isTogglePending={toggleFlag.isPending}
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
          onStop={() => stopAvailability.mutate()}
          isRunPending={triggerAvailability.isPending}
          isStopPending={stopAvailability.isPending}
          historyContent={<AvailabilityHistorySection />}
          settingsContent={
            <div className="space-y-6">
              <LogicDescription lines={[
                'בודקת האם דירות שנסרקו עדיין קיימות באתר המקור (לא משלימה נתונים — לשם כך קיים תהליך השלמת הנתונים).',
                'שלב 1: בדיקת HEAD מהירה (3 שניות) — מזהה 404, הפניות לעמוד ראשי, ושגיאות שרת.',
                'שלב 2: סריקת Firecrawl — בודקת האם בדף קיימים סימני נכס (₪, חדרים, מ"ר). אם כן — הנכס אקטיבי. אם לא ונמצאו סימני הסרה — מסומן כלא פעיל.',
                'לוגיקת recheck חכמה: נכסים חדשים (פחות מ-3 ימים) לא נבדקים כלל. בדיקה ראשונה רק אחרי 3 ימים, recheck ראשון אחרי 8 ימים, rechecks חוזרים כל 2 ימים.',
                'מכסה יומית מוגדרת למניעת עומס.',
              ]} />
              <ScheduleTimeEditor
                category="availability"
                cronJobNames={[{ jobName: 'availability-check-continuous', cronTemplate: (h, m) => `${m} ${h} * * *` }]}
                label="שעות ריצת בדיקת זמינות"
                showEndTime
              />
              <AvailabilitySettingsContent />
            </div>
          }
          historyTitle="היסטוריית בדיקות זמינות"
          settingsTitle="הגדרות בדיקת זמינות"
          enabled={processFlags?.process_availability ?? true}
          onToggleEnabled={(v) => toggleFlag.mutate({ name: 'process_availability', enabled: v })}
          isTogglePending={toggleFlag.isPending}
        />

        {/* Availability Jina */}
        <ProcessCard
          title="בדיקת זמינות 2 (Jina)"
          icon={<Shield className="h-4 w-4 text-teal-600" />}
          iconColor="bg-teal-100 dark:bg-teal-900/30"
          status={isAvailRunning ? 'running' : lastAvailRun ? 'completed' : 'idle'}
          statusText={isAvailRunning ? 'בודק זמינות (Jina)...' : lastAvailRun ? `${lastAvailRun.properties_checked ?? 0} נבדקו, ${lastAvailRun.inactive_marked ?? 0} הוסרו` : 'לא הופעל'}
          metrics={[
            { label: 'נותרו', value: stats?.pendingRecheck ?? 0 },
            { label: 'נבדקו היום', value: stats?.checkedToday ?? 0 },
            { label: 'Timeouts', value: stats?.timeouts ?? 0 },
          ]}
          lastRun={formatLastRun(lastAvailRun?.started_at, lastAvailRun?.completed_at)}
          onRun={() => triggerAvailabilityJina.mutate()}
          onStop={() => stopAvailabilityJina.mutate()}
          isRunPending={triggerAvailabilityJina.isPending}
          isStopPending={stopAvailabilityJina.isPending}
          historyContent={<AvailabilityHistorySection />}
          settingsContent={
            <div className="space-y-6">
              <LogicDescription lines={[
                'ניסוי: אותה לוגיקת בדיקת זמינות, אבל עם Jina AI Reader במקום Firecrawl.',
                'משתמש ב-r.jina.ai לסריקת דפים ובודק אותם מחרוזות הסרה בדיוק כמו המערכת המקורית.',
                'זיהוי skeleton למדלן: תוכן קצר מ-1000 תווים מסומן כ-retryable.',
              ]} />
            </div>
          }
          historyTitle="היסטוריית בדיקות זמינות (Jina)"
          settingsTitle="הגדרות בדיקת זמינות (Jina)"
          enabled={processFlags?.process_availability_jina ?? true}
          onToggleEnabled={(v) => toggleFlag.mutate({ name: 'process_availability_jina', enabled: v })}
          isTogglePending={toggleFlag.isPending}
        />

        {/* Dedup */}
        <ProcessCard
          title="כפילויות"
          icon={<Copy className="h-4 w-4 text-purple-600" />}
          iconColor="bg-purple-100 dark:bg-purple-900/30"
          status={dedupStats?.lastRun?.status === 'running' ? 'running' : dedupStats?.lastRun?.status === 'completed' ? 'completed' : dedupStats?.unchecked ? 'idle' : 'idle'}
          statusText={dedupStats?.lastRun?.status === 'running' ? 'סורק כפילויות...' : `${dedupStats?.checked ?? 0} מתוך ${dedupStats?.totalActive ?? 0} נבדקו`}
          metrics={[
            { label: 'נבדקו', value: `${(dedupStats?.checked ?? 0).toLocaleString('he-IL')} / ${(dedupStats?.totalActive ?? 0).toLocaleString('he-IL')}` },
            { label: 'נותרו לבדיקה', value: dedupStats?.unchecked ?? 0 },
          ]}
          onRun={() => triggerDedup.mutate()}
          isRunPending={triggerDedup.isPending}
          historyContent={<DeduplicationStatus />}
          settingsContent={
            <div className="space-y-6">
              <LogicDescription lines={[
                'מזהה דירות כפולות בין מקורות שונים (cross-source) — למשל אותה דירה ביד2 ובמדלן.',
                'התאמה לפי: כתובת מלאה (כולל מספר בית), מספר חדרים (סטייה של ±0.5), ושטח (סטייה של ±20%).',
                'הפרדה חובה לפי סוג עסקה — דירה להשכרה ודירה למכירה באותה כתובת לא ייחשבו ככפילות.',
                'כל קבוצת כפילויות מקבלת "נכס ראשי" (Winner) לפי היררכיה: פרטי > מתווך → עדכון אחרון → מחיר נמוך → זמן יצירה ישן.',
                'נכסים שאינם ראשיים (Losers) מוסתרים מהתצוגה הראשית ומההתאמות, אבל נגישים דרך "עוד מודעות".',
                'כפילויות מאותו מקור נחסמות אוטומטית לפי source + source_url (Unique Constraint).',
                'ניקוי אוטומטי מריץ recompute_duplicate_winners אחרי כל זיהוי.',
              ]} />
              <ScheduleTimeEditor
                category="duplicates"
                cronJobNames={[{ jobName: 'cleanup-orphan-duplicates-hourly', cronTemplate: (h, m) => `${m} ${h} * * *` }]}
                label="שעות ריצת ניקוי כפילויות"
                showEndTime
              />
            </div>
          }
          historyTitle="כפילויות"
          settingsTitle="הגדרות כפילויות"
          enabled={processFlags?.process_duplicates ?? true}
          onToggleEnabled={(v) => toggleFlag.mutate({ name: 'process_duplicates', enabled: v })}
          isTogglePending={toggleFlag.isPending}
        />

        {/* Matching */}
        <ProcessCard
          title="התאמות"
          icon={<Users className="h-4 w-4 text-green-600" />}
          iconColor="bg-green-100 dark:bg-green-900/30"
          status={isMatchRunning ? 'running' : matchStats ? 'completed' : 'idle'}
          statusText={isMatchRunning ? 'מחפש התאמות...' : `${leadCounts?.eligible ?? 0} eligible | ${leadCounts?.ineligible ?? 0} לא eligible`}
          metrics={[
            { label: 'לידים Eligible', value: leadCounts?.eligible ?? 0 },
            { label: 'לידים לא Eligible', value: leadCounts?.ineligible ?? 0 },
          ]}
          lastRun={matchStats?.completed_at ? format(new Date(matchStats.completed_at), 'dd/MM HH:mm', { locale: he }) : undefined}
          onRun={() => triggerMatching.mutate()}
          isRunPending={triggerMatching.isPending}
          historyContent={<MatchingStatus />}
          settingsContent={
            <div className="space-y-6">
              <LogicDescription lines={[
                'מחפש התאמות בין לידים במצב "eligible" לבין נכסים פעילים (scouted_properties).',
                'בודק התאמה לפי: עיר, שכונה, טווח מחיר, חדרים, גודל, קומה.',
                'בודק גם דרישות נוספות: מעלית, חנייה, מרפסת, ממ"ד, גינה, גג — כולל גמישות אם הליד ציין.',
                'תוצאות נשמרות ב-personal_scout_matches ומקושרות לליד ולריצה.',
              ]} />
              <ScheduleTimeEditor
                category="matching"
                cronJobNames={[{ jobName: 'match-leads-job', cronTemplate: (h, m) => `${m} ${h} * * *` }]}
                label="שעות ריצת התאמות"
                showEndTime
              />
            </div>
          }
          historyTitle="היסטוריית התאמות"
          settingsTitle="הגדרות התאמות"
          enabled={processFlags?.process_matching ?? true}
          onToggleEnabled={(v) => toggleFlag.mutate({ name: 'process_matching', enabled: v })}
          isTogglePending={toggleFlag.isPending}
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
            <div className="space-y-6">
              <LogicDescription lines={[
                'משלים נתונים חסרים לדירות שנסרקו באמצעות Firecrawl (סריקת עמוד המקור).',
                'מטפל בנכסים עם backfill_status=null (טרם טופלו) או failed (נכשלו בעבר).',
                'משלים: חדרים, מחיר, גודל, סיווג פרטי/מתווך, features (מרפסת, מעלית, חנייה, ממ"ד), ומספר בית.',
                'כל נכס שהושלם בהצלחה מסומן completed. נכשלים מסומנים failed ויטופלו שוב בריצה הבאה.',
              ]} />
              <ScheduleTimeEditor
                category="backfill"
                cronJobNames={[{ jobName: 'backfill-data-completion-job', cronTemplate: (h, m) => `${m} ${h} * * *` }]}
                label="שעות ריצת השלמת נתונים"
                showEndTime
              />
            </div>
          }
          historyTitle="היסטוריית השלמת נתונים"
          settingsTitle="הגדרות השלמת נתונים"
          enabled={processFlags?.process_backfill ?? true}
          onToggleEnabled={(v) => toggleFlag.mutate({ name: 'process_backfill', enabled: v })}
          isTogglePending={toggleFlag.isPending}
        />

        {/* Backfill Jina */}
        <ProcessCard
          title="השלמת נתונים 2 (Jina)"
          icon={<Database className="h-4 w-4 text-teal-600" />}
          iconColor="bg-teal-100 dark:bg-teal-900/30"
          status={backfillJina.isRunning ? 'running' : backfillJina.progress?.status === 'completed' ? 'completed' : 'idle'}
          statusText={backfillJina.isRunning ? `${backfillJina.progress?.processed_items ?? 0}/${backfillJina.progress?.total_items ?? '?'}` : backfillJina.progress?.status === 'completed' ? 'הושלם' : 'לא הופעל'}
          metrics={[
            { label: 'נותרו', value: backfillRemaining ?? 0 },
            { label: 'הצלחות', value: backfillJina.progress?.successful_items ?? 0 },
            { label: 'כשלונות', value: backfillJina.progress?.failed_items ?? 0 },
          ]}
          onRun={backfillJina.start}
          onStop={backfillJina.stop}
          isRunPending={backfillJina.isStarting}
          isStopPending={backfillJina.isStopping}
          historyContent={<BackfillJinaHistory />}
          historyTitle="היסטוריית השלמת נתונים (Jina)"
          settingsContent={
            <div className="space-y-6">
              <LogicDescription lines={[
                'אותה לוגיקת השלמת נתונים כמו המקורית, אבל עם Jina AI Reader במקום Firecrawl.',
                'משלים: חדרים, מחיר, גודל, סיווג פרטי/מתווך, features, ומספר בית.',
                'משתמש ב-JINA_API_KEY עם פרוקסי premium לעקיפת חסימות.',
              ]} />
            </div>
          }
          settingsTitle="הגדרות השלמת נתונים (Jina)"
          enabled={processFlags?.process_backfill_jina ?? true}
          onToggleEnabled={(v) => toggleFlag.mutate({ name: 'process_backfill_jina', enabled: v })}
          isTogglePending={toggleFlag.isPending}
        />
      </div>

      {/* Schedule Summary */}
      <ScheduleSummaryCard />
    </div>
  );
};
