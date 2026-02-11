import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Shield, Clock, AlertTriangle, CheckCircle, XCircle, Loader2,
  RefreshCw, ChevronDown, ExternalLink, Play, Timer, Database,
  Settings, Hourglass,
} from 'lucide-react';

// ─── Types ───
interface AvailabilityRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  properties_checked: number | null;
  inactive_marked: number | null;
  error_message: string | null;
}

interface CheckedProperty {
  id: string;
  address: string | null;
  city: string | null;
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
  switch (reason) {
    case 'content_ok':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px]">✓ אקטיבי</Badge>;
    case 'listing_removed_indicator':
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px]">הוסר</Badge>;
    case 'per_property_timeout':
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-[10px]">Timeout</Badge>;
    case 'firecrawl_failed_after_retries':
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">Firecrawl נכשל</Badge>;
    case 'short_removal_page_suspicious':
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px]">חשוד</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{reason}</Badge>;
  }
};

// ─── Source Badge ───
const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  switch (source.toLowerCase()) {
    case 'yad2':
      return <Badge className="bg-orange-500 text-white text-[10px]">Yad2</Badge>;
    case 'madlan':
      return <Badge className="bg-blue-500 text-white text-[10px]">Madlan</Badge>;
    case 'homeless':
      return <Badge className="bg-purple-500 text-white text-[10px]">Homeless</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{source}</Badge>;
  }
};

// ─── Main Dashboard ───
export const AvailabilityCheckDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [runsOpen, setRunsOpen] = useState(true);
  const [resultsOpen, setResultsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      return data as AvailabilityRun[];
    },
    refetchInterval: 10000,
  });

  const { data: stats } = useQuery({
    queryKey: ['availability-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [pendingRes, checkedTodayRes, timeoutRes, totalActiveRes] = await Promise.all([
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true })
          .eq('is_active', true).is('availability_checked_at', null),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true })
          .gte('availability_checked_at', today.toISOString()),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true })
          .eq('availability_check_reason', 'per_property_timeout').eq('is_active', true),
        supabase.from('scouted_properties').select('id', { count: 'exact', head: true })
          .eq('is_active', true),
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

  const { data: recentResults, isLoading: resultsLoading } = useQuery({
    queryKey: ['availability-results', reasonFilter],
    queryFn: async () => {
      let query = supabase
        .from('scouted_properties')
        .select('id, address, city, source, source_url, availability_check_reason, availability_checked_at, is_active')
        .not('availability_checked_at', 'is', null)
        .order('availability_checked_at', { ascending: false })
        .limit(100);

      if (reasonFilter !== 'all') {
        query = query.eq('availability_check_reason', reasonFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CheckedProperty[];
    },
    refetchInterval: 15000,
  });

  const { data: settings } = useQuery({
    queryKey: ['availability-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_settings')
        .select('*')
        .eq('category', 'availability')
        .order('setting_key');
      if (error) throw error;
      return data as AvailabilitySetting[];
    },
  });

  // ─── Manual Check Mutation ───
  const manualCheckMutation = useMutation({
    mutationFn: async (propertyIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('check-property-availability', {
        body: { property_ids: propertyIds },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`בדיקה הושלמה - ${data?.results?.length ?? 0} נכסים נבדקו`);
      setSelectedProperties(new Set());
      queryClient.invalidateQueries({ queryKey: ['availability-results'] });
      queryClient.invalidateQueries({ queryKey: ['availability-stats'] });
      queryClient.invalidateQueries({ queryKey: ['availability-runs'] });
    },
    onError: (err: any) => {
      toast.error(`שגיאה בבדיקה: ${err.message}`);
    },
  });

  // ─── Helpers ───
  const toggleProperty = (id: string) => {
    setSelectedProperties(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!recentResults) return;
    if (selectedProperties.size === recentResults.length) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(recentResults.map(r => r.id)));
    }
  };

  const calculateDuration = (started: string, completed: string | null) => {
    if (!completed) return 'רץ...';
    const diffMs = new Date(completed).getTime() - new Date(started).getTime();
    const secs = Math.round(diffMs / 1000);
    if (secs < 60) return `${secs} שניות`;
    return `${Math.round(secs / 60)} דקות`;
  };

  const lastRun = runs?.[0];
  const isRunning = lastRun?.status === 'running';

  const settingLabels: Record<string, string> = {
    batch_size: 'גודל אצווה',
    concurrency_limit: 'מקביליות',
    daily_limit: 'מכסה יומית',
    delay_between_batches_ms: 'השהייה בין אצוות (ms)',
    delay_between_requests_ms: 'השהייה בין בקשות (ms)',
    firecrawl_max_retries: 'ניסיונות חוזרים Firecrawl',
    firecrawl_retry_delay_ms: 'השהייה בין ניסיונות (ms)',
    get_timeout_ms: 'Timeout GET (ms)',
    head_timeout_ms: 'Timeout HEAD (ms)',
    min_days_before_check: 'ימים לפני בדיקה ראשונה',
    per_property_timeout_ms: 'Timeout לנכס (ms)',
    recheck_interval_days: 'ימים בין בדיקות חוזרות',
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          title="ממתינים לבדיקה"
          value={stats?.pending ?? '—'}
          icon={<Hourglass className="h-5 w-5 text-amber-600" />}
          color="bg-amber-100 dark:bg-amber-900/30"
        />
        <StatCard
          title="נבדקו היום"
          value={stats?.checkedToday ?? '—'}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          color="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          title="Timeouts"
          value={stats?.timeouts ?? '—'}
          icon={<Timer className="h-5 w-5 text-orange-600" />}
          color="bg-orange-100 dark:bg-orange-900/30"
        />
        <StatCard
          title="סה״כ אקטיביים"
          value={stats?.totalActive ?? '—'}
          icon={<Database className="h-5 w-5 text-blue-600" />}
          color="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          title="ריצה אחרונה"
          value={lastRun ? (isRunning ? 'רץ כעת...' : calculateDuration(lastRun.started_at, lastRun.completed_at)) : '—'}
          icon={isRunning ? <Loader2 className="h-5 w-5 text-blue-600 animate-spin" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
          color={isRunning ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted'}
        />
      </div>

      {/* Run History */}
      <Collapsible open={runsOpen} onOpenChange={setRunsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <RefreshCw className="h-4 w-4" />
                  היסטוריית ריצות
                </CardTitle>
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
                  {/* Desktop */}
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
                          <TableRow key={run.id} className="h-9">
                            <TableCell className="py-1.5 text-xs">
                              {format(new Date(run.started_at), 'dd/MM HH:mm', { locale: he })}
                            </TableCell>
                            <TableCell className="py-1.5"><StatusBadge status={run.status} /></TableCell>
                            <TableCell className="py-1.5 text-xs font-medium">{run.properties_checked ?? 0}</TableCell>
                            <TableCell className="py-1.5 text-xs">
                              {(run.inactive_marked ?? 0) > 0 ? (
                                <span className="text-red-600 font-medium">{run.inactive_marked}</span>
                              ) : '0'}
                            </TableCell>
                            <TableCell className="py-1.5 text-[10px] text-muted-foreground">
                              {calculateDuration(run.started_at, run.completed_at)}
                            </TableCell>
                            <TableCell className="py-1.5 text-[10px] text-red-500 max-w-[200px] truncate">
                              {run.error_message || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden space-y-2">
                    {runs.slice(0, 20).map(run => (
                      <div key={run.id} className="border rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">
                            {format(new Date(run.started_at), 'dd/MM HH:mm', { locale: he })}
                          </span>
                          <StatusBadge status={run.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>נבדקו: <strong>{run.properties_checked ?? 0}</strong></span>
                          <span>הוסרו: <strong className="text-red-500">{run.inactive_marked ?? 0}</strong></span>
                          <span>{calculateDuration(run.started_at, run.completed_at)}</span>
                        </div>
                        {run.error_message && (
                          <p className="text-[10px] text-red-500 truncate">{run.error_message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Recent Results + Manual Check */}
      <Collapsible open={resultsOpen} onOpenChange={setResultsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" />
                  תוצאות אחרונות
                </CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${resultsOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="סנן לפי תוצאה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="content_ok">✓ אקטיבי</SelectItem>
                    <SelectItem value="listing_removed_indicator">הוסר</SelectItem>
                    <SelectItem value="per_property_timeout">Timeout</SelectItem>
                    <SelectItem value="firecrawl_failed_after_retries">Firecrawl נכשל</SelectItem>
                    <SelectItem value="short_removal_page_suspicious">חשוד</SelectItem>
                  </SelectContent>
                </Select>

                {selectedProperties.size > 0 && (
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => manualCheckMutation.mutate(Array.from(selectedProperties))}
                    disabled={manualCheckMutation.isPending}
                  >
                    {manualCheckMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
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
                  {/* Desktop */}
                  <div className="hidden md:block rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="h-9">
                          <TableHead className="py-2 w-[40px]">
                            <Checkbox
                              checked={selectedProperties.size === recentResults.length && recentResults.length > 0}
                              onCheckedChange={selectAll}
                            />
                          </TableHead>
                          <TableHead className="py-2 text-xs">כתובת</TableHead>
                          <TableHead className="py-2 text-xs w-[70px]">מקור</TableHead>
                          <TableHead className="py-2 text-xs w-[90px]">תוצאה</TableHead>
                          <TableHead className="py-2 text-xs w-[90px]">נבדק</TableHead>
                          <TableHead className="py-2 text-xs w-[40px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentResults.map(prop => (
                          <TableRow key={prop.id} className={`h-9 ${!prop.is_active ? 'opacity-50' : ''}`}>
                            <TableCell className="py-1.5">
                              <Checkbox
                                checked={selectedProperties.has(prop.id)}
                                onCheckedChange={() => toggleProperty(prop.id)}
                              />
                            </TableCell>
                            <TableCell className="py-1.5 text-xs">
                              <div className="truncate max-w-[250px]">
                                {prop.address || prop.city || 'ללא כתובת'}
                                {prop.city && prop.address && <span className="text-muted-foreground"> • {prop.city}</span>}
                              </div>
                            </TableCell>
                            <TableCell className="py-1.5"><SourceBadge source={prop.source} /></TableCell>
                            <TableCell className="py-1.5"><ReasonBadge reason={prop.availability_check_reason} /></TableCell>
                            <TableCell className="py-1.5 text-[10px] text-muted-foreground">
                              {prop.availability_checked_at
                                ? format(new Date(prop.availability_checked_at), 'dd/MM HH:mm', { locale: he })
                                : '—'}
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
                    {recentResults.slice(0, 30).map(prop => (
                      <div key={prop.id} className={`border rounded-lg p-3 space-y-1.5 ${!prop.is_active ? 'opacity-50' : ''}`}>
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={selectedProperties.has(prop.id)}
                            onCheckedChange={() => toggleProperty(prop.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{prop.address || 'ללא כתובת'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <SourceBadge source={prop.source} />
                              <ReasonBadge reason={prop.availability_check_reason} />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {prop.availability_checked_at
                                ? format(new Date(prop.availability_checked_at), 'dd/MM HH:mm', { locale: he })
                                : '—'}
                            </p>
                          </div>
                          {prop.source_url && (
                            <a href={prop.source_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Settings */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4" />
                  הגדרות בדיקת זמינות
                </CardTitle>
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
                      <p className="text-xs text-muted-foreground">{settingLabels[s.setting_key] || s.setting_key}</p>
                      <p className="text-lg font-bold mt-0.5">{s.setting_value}</p>
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
