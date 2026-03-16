import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Shield, Clock, AlertTriangle, CheckCircle, XCircle, Loader2,
  RefreshCw, ChevronDown, ExternalLink, Play, Timer, Database,
  Settings, Hourglass, Pencil, Save, X,
} from 'lucide-react';
import { useUpdateScoutSetting } from '@/hooks/useScoutSettings';
import { AvailabilityRunDetails } from './availability/AvailabilityRunDetails';

import { AvailabilityLiveFeed } from './availability/AvailabilityLiveFeed';
import { Json } from '@/integrations/supabase/types';

// ─── Types ───
interface AvailabilityRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  properties_checked: number | null;
  inactive_marked: number | null;
  error_message: string | null;
  run_details: Json;
}

interface CheckedProperty {
  id: string;
  address: string | null;
  city: string | null;
  neighborhood: string | null;
  price: number | null;
  rooms: number | null;
  source: string;
  source_url: string | null;
  availability_check_reason: string | null;
  availability_checked_at: string | null;
  is_active: boolean;
}

interface AvailabilitySetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
}

// ─── Stats Cards ───
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ title, value, icon, color = '' }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${color || 'bg-muted'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{title}</p>
        <p className="text-xl font-bold">{typeof value === 'number' ? value.toLocaleString('he-IL') : value}</p>
      </div>
    </CardContent>
  </Card>
);

// ─── Status Badge ───
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-600 text-white text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />הושלם</Badge>;
    case 'running':
      return <Badge className="bg-blue-600 text-white text-[10px]"><Loader2 className="h-3 w-3 mr-1 animate-spin" />רץ</Badge>;
    case 'failed':
      return <Badge className="bg-red-600 text-white text-[10px]"><XCircle className="h-3 w-3 mr-1" />נכשל</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
};

// ─── Reason Badge ───
const ReasonBadge: React.FC<{ reason: string | null }> = ({ reason }) => {
  if (!reason) return <span className="text-muted-foreground text-xs">—</span>;
  const map: Record<string, { className: string; label: string }> = {
    content_ok: { className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: '✓ אקטיבי' },
    listing_removed_indicator: { className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'הוסר' },
    per_property_timeout: { className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', label: 'Timeout' },
    firecrawl_failed_after_retries: { className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', label: 'Firecrawl נכשל' },
    short_removal_page_suspicious: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'חשוד' },
    no_indicators_keeping_active: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', label: 'ללא אינדיקטורים' },
  };
  const m = map[reason];
  if (m) return <Badge className={`${m.className} text-[10px]`}>{m.label}</Badge>;
  return <Badge variant="outline" className="text-[10px]">{reason}</Badge>;
};

// ─── Source Badge ───
const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  switch (source.toLowerCase()) {
    case 'yad2': return <Badge className="bg-orange-500 text-white text-[10px]">Yad2</Badge>;
    case 'madlan': return <Badge className="bg-blue-500 text-white text-[10px]">Madlan</Badge>;
    case 'homeless': return <Badge className="bg-purple-500 text-white text-[10px]">Homeless</Badge>;
    default: return <Badge variant="outline" className="text-[10px]">{source}</Badge>;
  }
};

const PAGE_SIZE = 50;

// ─── Main Dashboard ───
export const AvailabilityCheckDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const updateSetting = useUpdateScoutSetting();
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [runsOpen, setRunsOpen] = useState(true);
  const [resultsOpen, setResultsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<AvailabilityRun | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // ─── Queries ───
  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ['availability-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_check_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as AvailabilityRun[];
    },
    refetchInterval: 10000,
  });

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
      return {
        pending: pendingRes.count ?? 0,
        checkedToday: checkedTodayRes.count ?? 0,
        timeouts: timeoutRes.count ?? 0,
        totalActive: totalActiveRes.count ?? 0,
      };
    },
    refetchInterval: 15000,
  });

  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['availability-results', reasonFilter, sourceFilter, searchQuery, page],
    queryFn: async () => {
      let query = supabase
        .from('scouted_properties')
        .select('id, address, city, neighborhood, price, rooms, source, source_url, availability_check_reason, availability_checked_at, is_active', { count: 'exact' })
        .not('availability_checked_at', 'is', null)
        .order('availability_checked_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (reasonFilter !== 'all') query = query.eq('availability_check_reason', reasonFilter);
      if (sourceFilter !== 'all') query = query.eq('source', sourceFilter);
      if (searchQuery) query = query.or(`address.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);

      const { data, error, count } = await query;
      if (error) throw error;
      return { results: (data || []) as CheckedProperty[], total: count || 0 };
    },
    refetchInterval: 15000,
  });

  const recentResults = resultsData?.results || [];
  const totalResults = resultsData?.total || 0;
  const totalPages = Math.ceil(totalResults / PAGE_SIZE);

  const { data: settings } = useQuery({
    queryKey: ['availability-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('scout_settings').select('*').eq('category', 'availability').order('setting_key');
      if (error) throw error;
      return data as AvailabilitySetting[];
    },
  });

  // ─── Manual Check Mutation ───
  const manualCheckMutation = useMutation({
    mutationFn: async (propertyIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('check-property-availability-jina', { body: { property_ids: propertyIds } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`בדיקה הושלמה - ${data?.checked ?? 0} נכסים נבדקו`);
      setSelectedProperties(new Set());
      queryClient.invalidateQueries({ queryKey: ['availability-results'] });
      queryClient.invalidateQueries({ queryKey: ['availability-stats'] });
      queryClient.invalidateQueries({ queryKey: ['availability-runs'] });
    },
    onError: (err: any) => toast.error(`שגיאה: ${err.message}`),
  });

  // ─── Helpers ───
  const toggleProperty = (id: string) => {
    setSelectedProperties(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAll = () => {
    if (!recentResults) return;
    setSelectedProperties(prev => prev.size === recentResults.length ? new Set() : new Set(recentResults.map(r => r.id)));
  };
  const calculateDuration = (started: string, completed: string | null) => {
    if (!completed) return 'רץ...';
    const secs = Math.round((new Date(completed).getTime() - new Date(started).getTime()) / 1000);
    return secs < 60 ? `${secs} שניות` : `${Math.round(secs / 60)} דקות`;
  };

  const handleSaveSetting = (key: string) => {
    updateSetting.mutate({ category: 'availability', setting_key: key, setting_value: editValue }, {
      onSuccess: () => {
        setEditingKey(null);
        queryClient.invalidateQueries({ queryKey: ['availability-settings'] });
      },
    });
  };

  const lastRun = runs?.[0];
  const isRunning = lastRun?.status === 'running';

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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard title="ממתינים לבדיקה" value={stats?.pending ?? '—'} icon={<Hourglass className="h-5 w-5 text-amber-600" />} color="bg-amber-100 dark:bg-amber-900/30" />
        <StatCard title="נבדקו היום" value={stats?.checkedToday ?? '—'} icon={<CheckCircle className="h-5 w-5 text-green-600" />} color="bg-green-100 dark:bg-green-900/30" />
        <StatCard title="Timeouts" value={stats?.timeouts ?? '—'} icon={<Timer className="h-5 w-5 text-orange-600" />} color="bg-orange-100 dark:bg-orange-900/30" />
        <StatCard title="סה״כ אקטיביים" value={stats?.totalActive ?? '—'} icon={<Database className="h-5 w-5 text-blue-600" />} color="bg-blue-100 dark:bg-blue-900/30" />
        <StatCard title="ריצה אחרונה" value={lastRun ? (isRunning ? 'רץ כעת...' : calculateDuration(lastRun.started_at, lastRun.completed_at)) : '—'}
          icon={isRunning ? <Loader2 className="h-5 w-5 text-blue-600 animate-spin" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
          color={isRunning ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted'} />
      </div>

      {/* Quick Actions */}
      <AvailabilityActions />

      {/* Live Feed - only shows when a run is active */}
      <AvailabilityLiveFeed />

      {/* Run History */}
      <Collapsible open={runsOpen} onOpenChange={setRunsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base"><RefreshCw className="h-4 w-4" />היסטוריית ריצות</CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${runsOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0">
              {runsLoading ? (
                <div className="text-center py-6"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
              ) : !runs?.length ? (
                <div className="text-center py-6 text-muted-foreground">אין היסטוריית ריצות</div>
              ) : (
                <>
                  <div className="hidden md:block rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="h-9">
                          <TableHead className="py-2 text-xs">תאריך</TableHead>
                          <TableHead className="py-2 text-xs w-[80px]">סטטוס</TableHead>
                          <TableHead className="py-2 text-xs w-[70px]">נבדקו</TableHead>
                          <TableHead className="py-2 text-xs w-[80px]">לא אקטיביים</TableHead>
                          <TableHead className="py-2 text-xs w-[60px]">משך</TableHead>
                          <TableHead className="py-2 text-xs">שגיאה</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {runs.map(run => (
                          <TableRow key={run.id} className="h-9 cursor-pointer hover:bg-muted/80" onClick={() => setSelectedRun(run)}>
                            <TableCell className="py-1.5 text-xs">{format(new Date(run.started_at), 'dd/MM HH:mm', { locale: he })}</TableCell>
                            <TableCell className="py-1.5"><StatusBadge status={run.status} /></TableCell>
                            <TableCell className="py-1.5 text-xs font-medium">{run.properties_checked ?? 0}</TableCell>
                            <TableCell className="py-1.5 text-xs">
                              {(run.inactive_marked ?? 0) > 0 ? <span className="text-red-600 font-medium">{run.inactive_marked}</span> : '0'}
                            </TableCell>
                            <TableCell className="py-1.5 text-[10px] text-muted-foreground">{calculateDuration(run.started_at, run.completed_at)}</TableCell>
                            <TableCell className="py-1.5 text-[10px] text-red-500 max-w-[200px] truncate">{run.error_message || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Mobile */}
                  <div className="md:hidden space-y-2">
                    {runs.slice(0, 20).map(run => (
                      <div key={run.id} className="border rounded-lg p-3 space-y-1 cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRun(run)}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{format(new Date(run.started_at), 'dd/MM HH:mm', { locale: he })}</span>
                          <StatusBadge status={run.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>נבדקו: <strong>{run.properties_checked ?? 0}</strong></span>
                          <span>הוסרו: <strong className="text-red-500">{run.inactive_marked ?? 0}</strong></span>
                          <span>{calculateDuration(run.started_at, run.completed_at)}</span>
                        </div>
                        {run.error_message && <p className="text-[10px] text-red-500 truncate">{run.error_message}</p>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Run Details Dialog */}
      <AvailabilityRunDetails run={selectedRun} open={!!selectedRun} onOpenChange={(open) => !open && setSelectedRun(null)} />

      {/* Recent Results */}
      <Collapsible open={resultsOpen} onOpenChange={setResultsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" />
                  תוצאות אחרונות ({totalResults.toLocaleString('he-IL')})
                </CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${resultsOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <Select value={reasonFilter} onValueChange={(v) => { setReasonFilter(v); setPage(0); }}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="תוצאה" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל התוצאות</SelectItem>
                    <SelectItem value="content_ok">✓ אקטיבי</SelectItem>
                    <SelectItem value="listing_removed_indicator">הוסר</SelectItem>
                    <SelectItem value="per_property_timeout">Timeout</SelectItem>
                    <SelectItem value="firecrawl_failed_after_retries">Firecrawl נכשל</SelectItem>
                    <SelectItem value="no_indicators_keeping_active">ללא אינדיקטורים</SelectItem>
                    <SelectItem value="short_removal_page_suspicious">חשוד</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(0); }}>
                  <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue placeholder="מקור" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל המקורות</SelectItem>
                    <SelectItem value="yad2">Yad2</SelectItem>
                    <SelectItem value="madlan">Madlan</SelectItem>
                    <SelectItem value="homeless">Homeless</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="חפש כתובת / עיר..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  className="h-8 text-xs w-[180px]"
                />
                {selectedProperties.size > 0 && (
                  <Button size="sm" className="h-8 text-xs gap-1" onClick={() => manualCheckMutation.mutate(Array.from(selectedProperties))} disabled={manualCheckMutation.isPending}>
                    {manualCheckMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                    בדוק {selectedProperties.size} נכסים
                  </Button>
                )}
              </div>

              {resultsLoading ? (
                <div className="text-center py-6"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
              ) : !recentResults?.length ? (
                <div className="text-center py-6 text-muted-foreground">אין תוצאות</div>
              ) : (
                <>
                  <div className="hidden md:block rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="h-9">
                          <TableHead className="py-2 w-[40px]">
                            <Checkbox checked={selectedProperties.size === recentResults.length && recentResults.length > 0} onCheckedChange={selectAll} />
                          </TableHead>
                          <TableHead className="py-2 text-xs">כתובת</TableHead>
                          <TableHead className="py-2 text-xs w-[70px]">מקור</TableHead>
                          <TableHead className="py-2 text-xs w-[60px]">מחיר</TableHead>
                          <TableHead className="py-2 text-xs w-[50px]">חדרים</TableHead>
                          <TableHead className="py-2 text-xs w-[90px]">תוצאה</TableHead>
                          <TableHead className="py-2 text-xs w-[90px]">נבדק</TableHead>
                          <TableHead className="py-2 text-xs w-[40px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentResults.map(prop => (
                          <TableRow
                            key={prop.id}
                            className={`h-9 ${!prop.is_active ? 'opacity-50' : ''} ${prop.availability_check_reason === 'no_indicators_keeping_active' ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
                          >
                            <TableCell className="py-1.5"><Checkbox checked={selectedProperties.has(prop.id)} onCheckedChange={() => toggleProperty(prop.id)} /></TableCell>
                            <TableCell className="py-1.5 text-xs">
                              <div className="truncate max-w-[200px]">
                                {prop.address || prop.city || 'ללא כתובת'}
                                {prop.neighborhood && <span className="text-muted-foreground"> • {prop.neighborhood}</span>}
                              </div>
                            </TableCell>
                            <TableCell className="py-1.5"><SourceBadge source={prop.source} /></TableCell>
                            <TableCell className="py-1.5 text-xs">{prop.price ? `₪${(prop.price / 1000).toFixed(0)}K` : '—'}</TableCell>
                            <TableCell className="py-1.5 text-xs">{prop.rooms || '—'}</TableCell>
                            <TableCell className="py-1.5"><ReasonBadge reason={prop.availability_check_reason} /></TableCell>
                            <TableCell className="py-1.5 text-[10px] text-muted-foreground">
                              {prop.availability_checked_at ? format(new Date(prop.availability_checked_at), 'dd/MM HH:mm', { locale: he }) : '—'}
                            </TableCell>
                            <TableCell className="py-1.5">
                              {prop.source_url && (
                                <a href={prop.source_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden space-y-2">
                    {recentResults.map(prop => (
                      <div key={prop.id} className={`border rounded-lg p-3 space-y-1.5 ${!prop.is_active ? 'opacity-50' : ''} ${prop.availability_check_reason === 'no_indicators_keeping_active' ? 'border-yellow-300 dark:border-yellow-700' : ''}`}>
                        <div className="flex items-start gap-2">
                          <Checkbox checked={selectedProperties.has(prop.id)} onCheckedChange={() => toggleProperty(prop.id)} className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{prop.address || 'ללא כתובת'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <SourceBadge source={prop.source} />
                              <ReasonBadge reason={prop.availability_check_reason} />
                              {prop.price && <span className="text-[10px] text-muted-foreground">₪{(prop.price / 1000).toFixed(0)}K</span>}
                            </div>
                          </div>
                          {prop.source_url && (
                            <a href={prop.source_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground"><ExternalLink className="h-4 w-4" /></a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>הקודם</Button>
                      <span className="text-xs text-muted-foreground">עמוד {page + 1} מתוך {totalPages}</span>
                      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>הבא</Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Settings (Editable) */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base"><Settings className="h-4 w-4" />הגדרות בדיקת זמינות</CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0">
              {settings?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {settings.map(s => (
                    <div key={s.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{settingLabels[s.setting_key] || s.setting_key}</p>
                        {editingKey === s.setting_key ? (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleSaveSetting(s.setting_key)} disabled={updateSetting.isPending}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingKey(null)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingKey(s.setting_key); setEditValue(s.setting_value); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {editingKey === s.setting_key ? (
                        <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 mt-1 text-sm" dir="ltr" />
                      ) : (
                        <p className="text-lg font-bold mt-0.5">{s.setting_value}</p>
                      )}
                      {s.description && <p className="text-[10px] text-muted-foreground mt-1">{s.description}</p>}
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
    </div>
  );
};
