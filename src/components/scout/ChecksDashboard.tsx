import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Hourglass, CheckCircle, Timer, Database, Clock, Loader2,
  Copy, Users, ChevronDown, Settings,
  Pencil, Save, X,
} from 'lucide-react';
import { useUpdateScoutSetting } from '@/hooks/useScoutSettings';
import { AvailabilityActions } from './availability/AvailabilityActions';
import { AvailabilityLiveFeed } from './availability/AvailabilityLiveFeed';
import { ChecksSubTabs } from './checks/ChecksSubTabs';
import { UnifiedScoutSettings } from './UnifiedScoutSettings';

// Stats Card
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ title, value, icon, color = '' }) => (
  <Card>
    <CardContent className="p-3 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${color || 'bg-muted'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground truncate">{title}</p>
        <p className="text-lg font-bold">{typeof value === 'number' ? value.toLocaleString('he-IL') : value}</p>
      </div>
    </CardContent>
  </Card>
);

export const ChecksDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const updateSetting = useUpdateScoutSetting();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [availSettingsOpen, setAvailSettingsOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Availability stats
  const { data: stats } = useQuery({
    queryKey: ['availability-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [pendingRes, checkedTodayRes, timeoutRes, totalActiveRes] = await Promise.all([
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).eq('is_active', true).is('availability_checked_at', null),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).gte('availability_checked_at', today.toISOString()),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).eq('availability_check_reason', 'per_property_timeout').eq('is_active', true),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      return { pending: pendingRes.count ?? 0, checkedToday: checkedTodayRes.count ?? 0, timeouts: timeoutRes.count ?? 0, totalActive: totalActiveRes.count ?? 0 };
    },
    refetchInterval: 15000,
  });

  // Last availability run
  const { data: lastRun } = useQuery({
    queryKey: ['availability-last-run'],
    queryFn: async () => {
      const { data } = await supabase.from('availability_check_runs').select('started_at, completed_at, status').order('started_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    refetchInterval: 10000,
  });

  // Dedup stats
  const { data: dedupStats } = useQuery({
    queryKey: ['dedup-stats-summary'],
    queryFn: async () => {
      const { count } = await supabase.from('duplicate_alerts').select('id', { count: 'exact', head: true }).eq('is_resolved', false);
      return { unresolved: count ?? 0 };
    },
    refetchInterval: 30000,
  });

  // Matching stats
  const { data: matchStats } = useQuery({
    queryKey: ['matching-stats-summary'],
    queryFn: async () => {
      const { data } = await supabase.from('personal_scout_runs').select('total_matches, completed_at').order('created_at', { ascending: false }).limit(1).maybeSingle();
      return { lastMatches: data?.total_matches ?? 0 };
    },
    refetchInterval: 30000,
  });

  // Availability settings
  const { data: availSettings } = useQuery({
    queryKey: ['availability-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('scout_settings').select('*').eq('category', 'availability').order('setting_key');
      if (error) throw error;
      return data;
    },
  });

  const isRunning = lastRun?.status === 'running';
  const calculateDuration = (started: string, completed: string | null) => {
    if (!completed) return 'רץ...';
    const secs = Math.round((new Date(completed).getTime() - new Date(started).getTime()) / 1000);
    return secs < 60 ? `${secs} שניות` : `${Math.round(secs / 60)} דקות`;
  };

  const handleSaveSetting = (key: string) => {
    updateSetting.mutate({ category: 'availability', setting_key: key, setting_value: editValue }, {
      onSuccess: () => { setEditingKey(null); queryClient.invalidateQueries({ queryKey: ['availability-settings'] }); },
    });
  };

  const settingLabels: Record<string, string> = {
    batch_size: 'גודל אצווה', concurrency_limit: 'מקביליות', daily_limit: 'מכסה יומית',
    delay_between_batches_ms: 'השהייה בין אצוות (ms)', delay_between_requests_ms: 'השהייה בין בקשות (ms)',
    firecrawl_max_retries: 'ניסיונות Firecrawl', firecrawl_retry_delay_ms: 'השהייה ניסיונות (ms)',
    get_timeout_ms: 'Timeout GET (ms)', head_timeout_ms: 'Timeout HEAD (ms)',
    min_days_before_check: 'ימים לפני בדיקה ראשונה', per_property_timeout_ms: 'Timeout לנכס (ms)',
    recheck_interval_days: 'ימים בין בדיקות',
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        <StatCard title="ממתינים לבדיקה" value={stats?.pending ?? '—'} icon={<Hourglass className="h-4 w-4 text-amber-600" />} color="bg-amber-100 dark:bg-amber-900/30" />
        <StatCard title="נבדקו היום" value={stats?.checkedToday ?? '—'} icon={<CheckCircle className="h-4 w-4 text-green-600" />} color="bg-green-100 dark:bg-green-900/30" />
        <StatCard title="Timeouts" value={stats?.timeouts ?? '—'} icon={<Timer className="h-4 w-4 text-orange-600" />} color="bg-orange-100 dark:bg-orange-900/30" />
        <StatCard title="סה״כ אקטיביים" value={stats?.totalActive ?? '—'} icon={<Database className="h-4 w-4 text-blue-600" />} color="bg-blue-100 dark:bg-blue-900/30" />
        <StatCard title="ריצה אחרונה" value={lastRun ? (isRunning ? 'רץ כעת...' : calculateDuration(lastRun.started_at, lastRun.completed_at)) : '—'}
          icon={isRunning ? <Loader2 className="h-4 w-4 text-blue-600 animate-spin" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
          color={isRunning ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted'} />
        <StatCard title="כפילויות פתוחות" value={dedupStats?.unresolved ?? '—'} icon={<Copy className="h-4 w-4 text-purple-600" />} color="bg-purple-100 dark:bg-purple-900/30" />
        <StatCard title="התאמות אחרונות" value={matchStats?.lastMatches ?? '—'} icon={<Users className="h-4 w-4 text-green-600" />} color="bg-green-100 dark:bg-green-900/30" />
      </div>

      {/* Live Feed */}
      <AvailabilityLiveFeed />

      {/* Quick Actions */}
      <AvailabilityActions />

      {/* Sub-Tabs: Scans, Availability, Dedup, Matching, Backfill */}
      <ChecksSubTabs />

      {/* Availability Settings (Collapsible) */}
      <Collapsible open={availSettingsOpen} onOpenChange={setAvailSettingsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base"><Settings className="h-4 w-4" />הגדרות בדיקת זמינות</CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${availSettingsOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0">
              {availSettings?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availSettings.map(s => (
                    <div key={s.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{settingLabels[s.setting_key] || s.setting_key}</p>
                        {editingKey === s.setting_key ? (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleSaveSetting(s.setting_key)} disabled={updateSetting.isPending}><Save className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingKey(null)}><X className="h-3 w-3" /></Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingKey(s.setting_key); setEditValue(String(s.setting_value)); }}><Pencil className="h-3 w-3" /></Button>
                        )}
                      </div>
                      {editingKey === s.setting_key ? (
                        <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 mt-1 text-sm" dir="ltr" />
                      ) : (
                        <p className="text-lg font-bold mt-0.5">{String(s.setting_value)}</p>
                      )}
                      {s.description && <p className="text-[10px] text-muted-foreground mt-1">{String(s.description)}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">אין הגדרות</div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Scout Settings (Collapsible) */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base"><Settings className="h-4 w-4" />הגדרות סריקה</CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0">
              <UnifiedScoutSettings />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
