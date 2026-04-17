import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import {
  Database, Copy, Users, Search, Shield, RotateCcw, Loader2,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/social/ConfirmDialog';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { LiveMonitor } from './checks/LiveMonitor';
import { ProcessCard } from './checks/ProcessCard';

import { ScoutRunHistory } from './ScoutRunHistory';
import { AvailabilityHistorySection } from './checks/AvailabilityHistorySection';
import { DeduplicationStatus } from './checks/DeduplicationStatus';
import { MatchingStatus } from './checks/MatchingStatus';
import { BackfillJinaHistory } from './checks/BackfillJinaHistory';
import { UnifiedScoutSettings } from './UnifiedScoutSettings';
import { useBackfillProgressJina } from '@/hooks/useBackfillProgressJina';
import { ScheduleTimeEditor } from './checks/ScheduleTimeEditor';
import { PendingPropertiesDialog } from './checks/PendingPropertiesDialog';
import { logger } from '@/utils/logger';


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
  const backfillJina = useBackfillProgressJina();
  const [pendingPropertiesOpen, setPendingPropertiesOpen] = React.useState(false);


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
        }, { count: 'exact', head: true }),
      ]);
      return { pending: pendingRes.count ?? 0, checkedToday: checkedTodayRes.count ?? 0, timeouts: timeoutRes.count ?? 0, totalActive: totalActiveRes.count ?? 0, pendingRecheck: recheckRes.count ?? 0 };
    },
    refetchInterval: 60000,
  });

  // Backfill remaining count
  const { data: backfillRemaining } = useQuery({
    queryKey: ['backfill-remaining'],
    queryFn: async () => {
      const { count } = await supabase
        .from('scouted_properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .or('backfill_status.is.null,backfill_status.eq.pending,backfill_status.eq.failed');
      return count ?? 0;
    },
    refetchInterval: 60000,
  });

  // Pending properties for matching (status='new' and active)
  const { data: matchingPendingCount } = useQuery({
    queryKey: ['matching-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('scouted_properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('status', 'new');
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60000,
  });

  // Lead stats for matching card
  const { data: leadCounts } = useQuery({
    queryKey: ['lead-eligibility-counts'],
    queryFn: async () => {
      const [eligibleRes, incompleteRes] = await Promise.all([
        supabase.from('contact_leads').select('id', { count: 'exact', head: true }).eq('matching_status', 'eligible'),
        supabase.from('contact_leads').select('id', { count: 'exact', head: true }).eq('matching_status', 'incomplete'),
      ]);
      const eligible = eligibleRes.count ?? 0;
      const incomplete = incompleteRes.count ?? 0;

      // Get unique lead_ids that have matches in active properties
      const { data: matchedProps } = await supabase
        .from('scouted_properties')
        .select('matched_leads')
        .eq('is_active', true)
        .not('matched_leads', 'is', null)
        .neq('matched_leads', '[]');

      const matchedLeadIds = new Set<string>();
      if (matchedProps) {
        for (const prop of matchedProps) {
          const leads = prop.matched_leads as any[];
          if (Array.isArray(leads)) {
            for (const l of leads) {
              if (l?.lead_id) matchedLeadIds.add(l.lead_id);
            }
          }
        }
      }

      // Get all eligible lead IDs to intersect
      const { data: eligibleLeads } = await supabase
        .from('contact_leads')
        .select('id')
        .eq('matching_status', 'eligible');

      const eligibleIds = new Set((eligibleLeads || []).map(l => l.id));
      const withMatches = [...matchedLeadIds].filter(id => eligibleIds.has(id)).length;
      const withoutMatches = eligible - withMatches;

      return { eligible, incomplete, total: eligible + incomplete, withMatches, withoutMatches };
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
    refetchInterval: 30000,
  });


  // Last scan run (Jina) — aggregate all runs from the last active day
  const { data: lastScanRunJina } = useQuery({
    queryKey: ['scan-last-run-jina'],
    queryFn: async () => {
      // Step 1: find the most recent run to get the date
      const { data: latestRun } = await (supabase.from('scout_runs')
        .select('started_at') as any)
        .eq('scanner', 'jina')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!latestRun) return null;

      // Step 2: get all runs from that same day
      const lastDate = new Date(latestRun.started_at);
      const dayStart = new Date(lastDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(lastDate);
      dayEnd.setHours(23, 59, 59, 999);

      const { data: runs } = await (supabase.from('scout_runs')
        .select('started_at, completed_at, status, properties_found, new_properties, source') as any)
        .eq('scanner', 'jina')
        .gte('started_at', dayStart.toISOString())
        .lte('started_at', dayEnd.toISOString())
        .order('started_at', { ascending: false });

      if (!runs || runs.length === 0) return null;

      // Step 3: aggregate
      const totalFound = runs.reduce((sum: number, r: any) => sum + (r.properties_found ?? 0), 0);
      const totalNew = runs.reduce((sum: number, r: any) => sum + (r.new_properties ?? 0), 0);
      const latestFullRun = runs[0]; // most recent run for status/timing

      return {
        ...latestFullRun,
        properties_found: totalFound,
        new_properties: totalNew,
      };
    },
    refetchInterval: 30000,
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
    refetchInterval: 60000,
  });

  // Matching stats
  const { data: matchStats } = useQuery({
    queryKey: ['matching-stats-summary'],
    queryFn: async () => {
      const { data } = await supabase.from('scout_runs').select('leads_matched, completed_at, properties_found, status').eq('source', 'matching').order('started_at', { ascending: false }).limit(1).maybeSingle();
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
      const { data, error } = await supabase.functions.invoke('stop-availability-run', { body: {} });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to stop');
      return data;
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
      const { data, error } = await supabase.functions.invoke('stop-availability-run', { body: {} });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to stop');
      return data;
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
      const { data, error } = await supabase.functions.invoke('trigger-matching', { body: { force: true } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('התאמות הופעלו');
      queryClient.invalidateQueries({ queryKey: ['matching-stats-summary'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

   // Trigger dedup (fire-and-forget)
    const triggerDedup = useMutation({
    mutationFn: async () => {
      supabase.functions.invoke('detect-duplicates', {
        body: { reset: true }
      }).catch(err => logger.error('Dedup trigger error:', err));
      return { fired: true };
    },
    onSuccess: () => {
      toast.success('בדיקת כפילויות הופעלה');
      queryClient.invalidateQueries({ queryKey: ['dedup-stats-summary'] });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['dedup-run-history'] });
        queryClient.invalidateQueries({ queryKey: ['dedup-live-stats'] });
      }, 2000);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Stop dedup
  const stopDedup = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('backfill_progress')
        .update({ status: 'stopped', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('task_name', 'dedup-scan')
        .eq('status', 'running');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('בדיקת כפילויות נעצרה');
      queryClient.invalidateQueries({ queryKey: ['dedup-stats-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dedup-run-history'] });
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

  const isScanJinaRunning = lastScanRunJina?.status === 'running';
  const isAvailRunning = lastAvailRun?.status === 'running';
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">

        {/* Scans Jina */}
        <ProcessCard
          title="סריקות"
          icon={<Search className="h-4 w-4 text-teal-600" />}
          status={isScanJinaRunning ? 'running' : lastScanRunJina ? 'completed' : 'idle'}
          primaryValue={0}
          primaryLabel="ממתינים לסריקה"
          secondaryLine={`${lastScanRunJina?.properties_found ?? 0} נמצאו`}
          insight={lastScanRunJina?.new_properties > 0 ? `${lastScanRunJina.new_properties} חדשים` : 'אין פריטים חדשים לטיפול'}
          insightType={lastScanRunJina?.new_properties > 0 ? 'ok' : 'info'}
          lastRun={formatLastRun(lastScanRunJina?.started_at, lastScanRunJina?.completed_at)}
          onRun={() => triggerScansJina.mutate()}
          onStop={() => stopScansJina.mutate()}
          isRunPending={triggerScansJina.isPending}
          isStopPending={stopScansJina.isPending}
          historyContent={<ScoutRunHistory />}
          settingsContent={
            <div className="space-y-6">
              <LogicDescription lines={[
                'סורק דירות מ-יד2, מדלן והומלס באמצעות Jina AI Reader לפי קונפיגורציות פעילות (עיר, שכונה, טווח מחיר/חדרים).',
                'כל קונפיגורציה רצה בנפרד, דף אחרי דף, עם השהייה מוגדרת בין דפים.',
                'דירות חדשות נשמרות אוטומטית. דירות קיימות מתעדכנות (מחיר, תאריך עדכון).',
                'כפילויות מאותו מקור נחסמות אוטומטית לפי source + source_url.',
              ]} />
              <UnifiedScoutSettings triggerFunction="trigger-scout-pages-jina" />
            </div>
          }
          historyTitle="היסטוריית סריקות"
          settingsTitle="הגדרות סריקות"
          enabled={processFlags?.process_scans_jina ?? true}
          onToggleEnabled={(v) => toggleFlag.mutate({ name: 'process_scans_jina', enabled: v })}
          isTogglePending={toggleFlag.isPending}
        />

        {/* Availability (Jina) */}
        <ProcessCard
          title="בדיקת זמינות"
          icon={<Shield className="h-4 w-4 text-blue-600" />}
          status={lastAvailRun?.status === 'running' ? 'running' : lastAvailRun ? 'completed' : 'idle'}
          primaryValue={stats?.pendingRecheck ?? 0}
          primaryLabel="ממתינים לבדיקה"
          secondaryLine={`${(lastAvailRun?.properties_checked ?? 0).toLocaleString('he-IL')} נבדקו`}
          insight={`${lastAvailRun?.inactive_marked ?? 0} סומנו לא פעילים`}
          insightType={(lastAvailRun?.inactive_marked ?? 0) > 0 ? 'warning' : 'ok'}
          lastRun={formatLastRun(lastAvailRun?.started_at, lastAvailRun?.completed_at)}
          onRun={() => triggerAvailabilityJina.mutate()}
          onStop={() => stopAvailabilityJina.mutate()}
          isRunPending={triggerAvailabilityJina.isPending}
          isStopPending={stopAvailabilityJina.isPending}
          historyContent={<AvailabilityHistorySection />}
          settingsContent={
            <div className="space-y-6">
              <LogicDescription lines={[
                'בודקת האם דירות שנסרקו עדיין קיימות באתר המקור באמצעות Jina AI Reader.',
                'שלב 1: בדיקת HEAD מהירה — מזהה 404, הפניות לעמוד ראשי, ושגיאות שרת.',
                'שלב 2: סריקת Jina — בודקת סימני נכס (₪, חדרים, מ"ר). אם כן — אקטיבי. אם לא — מסומן כלא פעיל.',
              ]} />
              <ScheduleTimeEditor
                category="availability"
                cronJobNames={[{ jobName: 'availability-check-continuous', cronTemplate: (h, m) => `${m} ${h} * * *` }]}
                label="שעות ריצת בדיקת זמינות"
                showEndTime
              />
            </div>
          }
          historyTitle="היסטוריית בדיקות זמינות"
          settingsTitle="הגדרות בדיקת זמינות"
          enabled={processFlags?.process_availability_jina ?? true}
          onToggleEnabled={(v) => toggleFlag.mutate({ name: 'process_availability_jina', enabled: v })}
          isTogglePending={toggleFlag.isPending}
          onPrimaryClick={() => setPendingPropertiesOpen(true)}
        />

        {/* Dedup */}
        <ProcessCard
          title="כפילויות"
          icon={<Copy className="h-4 w-4 text-purple-600" />}
          status={dedupStats?.lastRun?.status === 'running' ? 'running' : dedupStats?.lastRun?.status === 'completed' ? 'completed' : dedupStats?.lastRun?.status === 'failed' ? 'failed' : dedupStats?.lastRun?.status === 'stopped' ? 'completed' : 'idle'}
          primaryValue={dedupStats?.unchecked ?? 0}
          primaryLabel="ממתינים לבדיקה"
          secondaryLine={`${(dedupStats?.checked ?? 0).toLocaleString('he-IL')} נבדקו`}
          insight={dedupStats?.unchecked === 0 ? 'כל הנתונים טופלו' : `${dedupStats?.unchecked ?? 0} ממתינים`}
          insightType={dedupStats?.unchecked === 0 ? 'ok' : 'info'}
          onRun={() => triggerDedup.mutate()}
          onStop={() => stopDedup.mutate()}
          isRunPending={triggerDedup.isPending}
          isStopPending={stopDedup.isPending}
          historyContent={<DeduplicationStatus />}
          settingsContent={
            <div className="space-y-6">
              <LogicDescription lines={[
                'מזהה דירות כפולות בין מקורות שונים (cross-source) — למשל אותה דירה ביד2 ובמדלן.',
                'התאמה לפי: כתובת מלאה (כולל מספר בית), מספר חדרים (סטייה של ±0.5), ושטח (סטייה של ±20%).',
                'כל קבוצת כפילויות מקבלת "נכס ראשי" (Winner) לפי היררכיה: פרטי > מתווך → עדכון אחרון → מחיר נמוך.',
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
          status={isMatchRunning ? 'running' : matchStats ? 'completed' : 'idle'}
          primaryValue={matchingPendingCount ?? 0}
          primaryLabel="נכסים ממתינים להתאמה"
          secondaryLine={`${leadCounts?.eligible ?? 0} לקוחות פעילים | ${leadCounts?.withMatches ?? 0} עם התאמות`}
          insight={(leadCounts?.withoutMatches ?? 0) > 0 ? `${leadCounts?.withoutMatches} לקוחות ללא התאמות` : 'כל הלקוחות הותאמו ✓'}
          insightType={(leadCounts?.withoutMatches ?? 0) > 0 ? 'warning' : 'ok'}
          lastRun={matchStats?.completed_at ? format(new Date(matchStats.completed_at), 'dd/MM HH:mm', { locale: he }) : undefined}
          onRun={() => triggerMatching.mutate()}
          isRunPending={triggerMatching.isPending}
          historyContent={<MatchingStatus />}
          settingsContent={
            <div className="space-y-6">
              <LogicDescription lines={[
                'מחפש התאמות בין לידים במצב "eligible" לבין נכסים פעילים (scouted_properties).',
                'בודק התאמה לפי: עיר, שכונה, טווח מחיר, חדרים, גודל, קומה.',
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

        {/* Backfill (Jina) */}
        <ProcessCard
          title="השלמת נתונים"
          icon={<Database className="h-4 w-4 text-orange-600" />}
          status={backfillJina.isRunning ? 'running' : backfillJina.progress?.status === 'completed' ? 'completed' : 'idle'}
          primaryValue={backfillRemaining ?? 0}
          primaryLabel="ממתינים להשלמה"
          secondaryLine={`${(backfillJina.progress?.successful_items ?? 0).toLocaleString('he-IL')} הושלמו${backfillJina.failedCount > 0 ? ` · ${backfillJina.failedCount.toLocaleString('he-IL')} נכשלו` : ''}`}
          insight={backfillRemaining === 0 ? 'כל הנתונים טופלו' : backfillJina.isRunning ? `${backfillJina.progress?.processed_items ?? 0}/${backfillJina.progress?.total_items ?? '?'}` : 'לא זוהו עיכובים'}
          insightType={backfillRemaining === 0 ? 'ok' : backfillJina.isRunning ? 'info' : 'warning'}
          onRun={backfillJina.start}
          onStop={backfillJina.stop}
          isRunPending={backfillJina.isStarting}
          isStopPending={backfillJina.isStopping}
          extraAction={
            backfillJina.failedCount > 0 && !backfillJina.isRunning ? (
              <button
                className="bg-muted text-muted-foreground rounded-md px-3 py-1 text-[11px] font-medium flex items-center gap-1 hover:bg-muted/80 disabled:opacity-50 transition-colors border border-border/40"
                onClick={() => setRetryFailedConfirmOpen(true)}
                disabled={backfillJina.isRetryingFailed}
                title="אפס נכסים שנכשלו ונסה שוב"
              >
                {backfillJina.isRetryingFailed ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-2.5 w-2.5" />}
                נסה שוב נכשלים ({backfillJina.failedCount.toLocaleString('he-IL')})
              </button>
            ) : null
          }
          historyContent={<BackfillJinaHistory />}
          historyTitle="היסטוריית השלמת נתונים"
          settingsContent={
            <div className="space-y-6">
              <LogicDescription lines={[
                'משלים נתונים חסרים לדירות שנסרקו באמצעות Jina AI Reader.',
                'מטפל בנכסים עם backfill_status=null או failed.',
              ]} />
            </div>
          }
          settingsTitle="הגדרות השלמת נתונים"
          enabled={processFlags?.process_backfill_jina ?? true}
          onToggleEnabled={(v) => toggleFlag.mutate({ name: 'process_backfill_jina', enabled: v })}
          isTogglePending={toggleFlag.isPending}
        />
      </div>


      <PendingPropertiesDialog open={pendingPropertiesOpen} onOpenChange={setPendingPropertiesOpen} />

      <ConfirmDialog
        open={retryFailedConfirmOpen}
        onOpenChange={setRetryFailedConfirmOpen}
        title="לאפס נכסים שנכשלו?"
        description={`האם לאפס ${backfillJina.failedCount.toLocaleString('he-IL')} נכסים שנכשלו ולנסות להשלים אותם שוב? פעולה זו תחזיר אותם ל-pending ותפעיל את תהליך ההשלמה.`}
        confirmLabel="אפס ונסה שוב"
        onConfirm={() => backfillJina.retryFailed()}
      />
    </div>
  );
};
