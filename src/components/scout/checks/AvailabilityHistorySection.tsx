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
  CheckCircle, XCircle, Loader2, RefreshCw, ChevronDown, ExternalLink, Play, Shield,
} from 'lucide-react';
import { AvailabilityRunDetails } from '../availability/AvailabilityRunDetails';
import { Json } from '@/integrations/supabase/types';

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

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'completed': return <Badge className="bg-green-600 text-white text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />הושלם</Badge>;
    case 'running': return <Badge className="bg-blue-600 text-white text-[10px]"><Loader2 className="h-3 w-3 mr-1 animate-spin" />רץ</Badge>;
    case 'failed': return <Badge className="bg-red-600 text-white text-[10px]"><XCircle className="h-3 w-3 mr-1" />נכשל</Badge>;
    default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
};

const ReasonBadge: React.FC<{ reason: string | null }> = ({ reason }) => {
  if (!reason) return <span className="text-muted-foreground text-xs">—</span>;
  const map: Record<string, { className: string; label: string }> = {
    content_ok: { className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: '✓ אקטיבי' },
    listing_removed_indicator: { className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'הוסר' },
    per_property_timeout: { className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', label: 'Timeout' },
    firecrawl_failed_after_retries: { className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', label: 'סריקה נכשלה' },
    short_removal_page_suspicious: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'חשוד' },
    no_indicators_keeping_active: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', label: 'ללא אינדיקטורים' },
  };
  const m = map[reason];
  if (m) return <Badge className={`${m.className} text-[10px]`}>{m.label}</Badge>;
  return <Badge variant="outline" className="text-[10px]">{reason}</Badge>;
};

const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  switch (source.toLowerCase()) {
    case 'yad2': return <Badge className="bg-orange-500 text-white text-[10px]">Yad2</Badge>;
    case 'madlan': return <Badge className="bg-blue-500 text-white text-[10px]">Madlan</Badge>;
    case 'homeless': return <Badge className="bg-purple-500 text-white text-[10px]">Homeless</Badge>;
    default: return <Badge variant="outline" className="text-[10px]">{source}</Badge>;
  }
};

const PAGE_SIZE = 50;

export const AvailabilityHistorySection: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [runsOpen, setRunsOpen] = useState(true);
  const [resultsOpen, setResultsOpen] = useState(true);
  const [selectedRun, setSelectedRun] = useState<AvailabilityRun | null>(null);

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
    },
    onError: (err: any) => toast.error(`שגיאה: ${err.message}`),
  });

  const toggleProperty = (id: string) => {
    setSelectedProperties(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAll = () => {
    setSelectedProperties(prev => prev.size === recentResults.length ? new Set() : new Set(recentResults.map(r => r.id)));
  };
  const calculateDuration = (started: string, completed: string | null) => {
    if (!completed) return 'רץ...';
    const secs = Math.round((new Date(completed).getTime() - new Date(started).getTime()) / 1000);
    return secs < 60 ? `${secs} שניות` : `${Math.round(secs / 60)} דקות`;
  };

  return (
    <div className="space-y-4">
      {/* Run History */}
      <Collapsible open={runsOpen} onOpenChange={setRunsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base"><RefreshCw className="h-4 w-4" />היסטוריית ריצות זמינות</CardTitle>
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
                <div className="rounded-md border overflow-hidden">
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
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <AvailabilityRunDetails run={selectedRun} open={!!selectedRun} onOpenChange={(open) => !open && setSelectedRun(null)} />

      {/* Recent Results */}
      <Collapsible open={resultsOpen} onOpenChange={setResultsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4" />תוצאות אחרונות ({totalResults.toLocaleString('he-IL')})</CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${resultsOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Select value={reasonFilter} onValueChange={(v) => { setReasonFilter(v); setPage(0); }}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="תוצאה" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל התוצאות</SelectItem>
                    <SelectItem value="content_ok">✓ אקטיבי</SelectItem>
                    <SelectItem value="listing_removed_indicator">הוסר</SelectItem>
                    <SelectItem value="per_property_timeout">Timeout</SelectItem>
                    <SelectItem value="firecrawl_failed_after_retries">סריקה נכשלה</SelectItem>
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
                <Input placeholder="חפש כתובת / עיר..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }} className="h-8 text-xs w-[180px]" />
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
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="h-9">
                          <TableHead className="py-2 w-[40px]"><Checkbox checked={selectedProperties.size === recentResults.length && recentResults.length > 0} onCheckedChange={selectAll} /></TableHead>
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
                          <TableRow key={prop.id} className={`h-9 ${!prop.is_active ? 'opacity-50' : ''}`}>
                            <TableCell className="py-1.5"><Checkbox checked={selectedProperties.has(prop.id)} onCheckedChange={() => toggleProperty(prop.id)} /></TableCell>
                            <TableCell className="py-1.5 text-xs"><div className="truncate max-w-[200px]">{prop.address || prop.city || 'ללא כתובת'}{prop.neighborhood && <span className="text-muted-foreground"> • {prop.neighborhood}</span>}</div></TableCell>
                            <TableCell className="py-1.5"><SourceBadge source={prop.source} /></TableCell>
                            <TableCell className="py-1.5 text-xs">{prop.price ? `₪${(prop.price / 1000).toFixed(0)}K` : '—'}</TableCell>
                            <TableCell className="py-1.5 text-xs">{prop.rooms || '—'}</TableCell>
                            <TableCell className="py-1.5"><ReasonBadge reason={prop.availability_check_reason} /></TableCell>
                            <TableCell className="py-1.5 text-[10px] text-muted-foreground">{prop.availability_checked_at ? format(new Date(prop.availability_checked_at), 'dd/MM HH:mm', { locale: he }) : '—'}</TableCell>
                            <TableCell className="py-1.5">{prop.source_url && <a href={prop.source_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><ExternalLink className="h-3 w-3" /></a>}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
    </div>
  );
};
