import React, { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle, XCircle, Clock, Loader2, AlertTriangle,
  Search, Shield, Database, Monitor, ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

// ── Types ──

interface AvailDetail {
  property_id: string;
  source_url?: string;
  address?: string;
  source?: string;
  reason: string;
  is_inactive: boolean;
  checked_at?: string;
  price?: number;
  rooms?: number;
  neighborhood?: string;
  floor?: number;
}

interface PageStat {
  page: number;
  url: string;
  found: number;
  new: number;
  duration_ms: number;
  status: string;
  error?: string;
  retry_count?: number;
}

interface BackfillSummary {
  total_processed?: number;
  fields_updated?: Record<string, number>;
  scrape_failed?: number;
  no_new_data?: number;
  features_updated?: number;
  broker_classified?: number;
  no_content?: number;
  update_db_error?: number;
  recent_items?: BackfillRecentItem[];
}

interface BackfillRecentItem {
  address?: string;
  source?: string;
  source_url?: string;
  status: string; // ok | scrape_failed | no_content | no_new_data | blacklisted | update_error
  fields_found?: string[];
  fields_updated?: string[];
  broker_result?: string | null; // private | broker | null
  address_action?: string | null; // upgraded | set_new | mismatch | null
  timestamp: string;
}

// Unified feed item
interface FeedItem {
  type: 'availability' | 'scan' | 'backfill';
  timestamp: string;
  primary: string;
  details: string;
  source?: string;
  status: 'ok' | 'error' | 'warning' | 'pending';
  url?: string;
  extra?: { price?: number; rooms?: number; floor?: number };
}

// ── Config ──

const typeConfig = {
  availability: { icon: Shield, label: 'זמינות', bgClass: 'bg-blue-950/30 border-r-2 border-r-blue-500/40' },
  scan: { icon: Search, label: 'סריקה', bgClass: 'bg-orange-950/30 border-r-2 border-r-orange-500/40' },
  backfill: { icon: Database, label: 'השלמה', bgClass: 'bg-emerald-950/30 border-r-2 border-r-emerald-500/40' },
};

const statusIcon = (s: FeedItem['status']) => {
  switch (s) {
    case 'ok': return <CheckCircle className="h-4 w-4 text-green-400" />;
    case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    case 'pending': return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

// ── Helpers ──

const availReasonDetail = (reason: string, isInactive: boolean): { label: string; detail: string; status: FeedItem['status'] } => {
  if (isInactive) {
    if (reason.includes('redirect')) return { label: 'הוסר', detail: 'HEAD: 301 redirect — הפניה לעמוד ראשי', status: 'error' };
    if (reason.includes('404')) return { label: 'HTTP 404', detail: 'HEAD: 404 Not Found — הדף לא קיים', status: 'error' };
    if (reason.includes('410')) return { label: 'HTTP 410', detail: 'HEAD: 410 Gone — הדף הוסר לצמיתות', status: 'error' };
    if (reason.includes('removed') || reason.includes('listing')) return { label: 'הוסר', detail: 'תוכן מוסר — אין נתוני נכס בדף', status: 'error' };
    return { label: 'לא אקטיבי', detail: `סיבה: ${reason}`, status: 'error' };
  }
  if (reason === 'content_ok') return { label: 'אקטיבי', detail: 'תוכן תקין — מחיר/חדרים נמצאו בדף', status: 'ok' };
  if (reason.includes('timeout')) return { label: 'Timeout', detail: 'Timeout אחרי 50s — חוזר לתור הבדיקה', status: 'warning' };
  if (reason.includes('no_indicators')) return { label: 'ללא אינדיקטורים', detail: 'לא נמצאו סימני הסרה — נשאר אקטיבי', status: 'ok' };
  if (reason.includes('suspicious')) return { label: 'חשוד', detail: 'תוכן חשוד — נדרשת בדיקה ידנית', status: 'warning' };
  return { label: reason, detail: reason, status: 'ok' };
};

const sourceBadge = (source?: string) => {
  const map: Record<string, { text: string; cls: string }> = {
    yad2: { text: 'YAD2', cls: 'text-orange-400' },
    madlan: { text: 'MDLN', cls: 'text-blue-400' },
    homeless: { text: 'HMLS', cls: 'text-purple-400' },
  };
  const s = map[source?.toLowerCase() || ''];
  if (!s) return null;
  return <span className={`${s.cls} font-mono text-xs font-bold`}>{s.text}</span>;
};

const truncateUrl = (url?: string) => {
  if (!url) return '';
  try {
    const u = new URL(url);
    const path = u.pathname.length > 30 ? u.pathname.slice(0, 30) + '…' : u.pathname;
    return u.hostname.replace('www.', '') + path;
  } catch { return url.slice(0, 50); }
};

// ── Component ──

export const LiveMonitor: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Availability run
  const { data: availRun } = useQuery({
    queryKey: ['monitor-availability-run'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_check_runs')
        .select('id, started_at, properties_checked, run_details, status')
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 2000,
  });

  // Backfill run
  const { data: backfillRun } = useQuery({
    queryKey: ['monitor-backfill-run'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backfill_progress')
        .select('*')
        .eq('task_name', 'data_completion')
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 2000,
  });

  // Scan runs
  const { data: scanRuns } = useQuery({
    queryKey: ['monitor-scan-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_runs')
        .select('id, started_at, status, source, properties_found, new_properties, page_stats')
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    refetchInterval: 2000,
  });

  // ── Build feed items ──

  const feedItems: FeedItem[] = [];

  // Availability details
  const availDetails: AvailDetail[] = availRun?.run_details
    ? (Array.isArray(availRun.run_details) ? availRun.run_details as unknown as AvailDetail[] : [])
    : [];

  availDetails.forEach(d => {
    const { label, detail, status } = availReasonDetail(d.reason, d.is_inactive);
    feedItems.push({
      type: 'availability',
      timestamp: d.checked_at || '',
      primary: d.address || d.property_id?.slice(0, 8) || '?',
      details: `${truncateUrl(d.source_url)} | ${detail} | ${label}`,
      source: d.source,
      status,
      url: d.source_url,
      extra: { price: d.price, rooms: d.rooms, floor: d.floor },
    });
  });

  // Scan page stats
  scanRuns?.forEach(run => {
    const pages = run.page_stats as unknown as PageStat[] | null;
    if (!pages) return;
    pages.filter(p => p.status !== 'pending').forEach(p => {
      const isOk = p.status === 'completed';
      const isBlocked = p.status === 'blocked';
      const duration = p.duration_ms ? `${(p.duration_ms / 1000).toFixed(1)}s` : '';
      
      let detailParts: string[] = [];
      if (p.url) detailParts.push(truncateUrl(p.url));
      if (isOk) detailParts.push(`${p.found} נמצאו, ${p.new} חדשים`);
      if (isBlocked && p.error) detailParts.push(`BLOCKED: ${p.error}`);
      if (p.status === 'failed' && p.error) detailParts.push(`ERROR: ${p.error}`);
      if (duration) detailParts.push(duration);
      if (p.retry_count && p.retry_count > 0) detailParts.push(`ניסיון ${p.retry_count + 1}`);

      feedItems.push({
        type: 'scan',
        timestamp: run.started_at,
        primary: `עמ׳ ${p.page} — ${run.source || 'unknown'}`,
        details: detailParts.join(' | '),
        source: run.source,
        status: isOk ? 'ok' : isBlocked ? 'error' : p.status === 'failed' ? 'error' : 'warning',
      });
    });
  });

  // Backfill per-property items from recent_items
  if (backfillRun) {
    const summary = backfillRun.summary_data as unknown as BackfillSummary | null;
    const recentItems = summary?.recent_items || [];
    
    recentItems.forEach(item => {
      const statusMap: Record<string, FeedItem['status']> = {
        ok: 'ok',
        no_new_data: 'warning',
        scrape_failed: 'error',
        no_content: 'error',
        blacklisted: 'error',
        update_error: 'error',
      };

      // Build detail parts
      const detailParts: string[] = [];
      
      if (item.status === 'ok') {
        if (item.fields_found?.length) detailParts.push(`נמצאו: ${item.fields_found.join(', ')}`);
        if (item.fields_updated?.length) detailParts.push(`עודכנו: ${item.fields_updated.join(', ')}`);
        if (item.broker_result) detailParts.push(`סיווג: ${item.broker_result === 'private' ? 'פרטי' : 'תיווך'}`);
        if (item.address_action === 'upgraded') detailParts.push('כתובת שודרגה');
        if (item.address_action === 'set_new') detailParts.push('כתובת חדשה');
      } else if (item.status === 'no_new_data') {
        if (item.fields_found?.length) detailParts.push(`נמצאו: ${item.fields_found.join(', ')}`);
        detailParts.push('ללא נתונים חדשים (כבר קיימים)');
      } else if (item.status === 'scrape_failed') {
        detailParts.push('Scrape failed');
      } else if (item.status === 'no_content') {
        detailParts.push('אין תוכן בדף');
      } else if (item.status === 'blacklisted') {
        detailParts.push('מיקום מחוץ לת"א — בוטל');
      } else if (item.status === 'update_error') {
        detailParts.push('שגיאת עדכון DB');
      }

      feedItems.push({
        type: 'backfill',
        timestamp: item.timestamp,
        primary: item.address || '?',
        details: detailParts.join(' | ') || item.status,
        source: item.source,
        status: statusMap[item.status] || 'warning',
        url: item.source_url,
      });
    });
  }

  // Sort by timestamp
  feedItems.sort((a, b) => {
    if (!a.timestamp || !b.timestamp) return 0;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  const hasActivity = !!(availRun || backfillRun || (scanRuns && scanRuns.length > 0));

  // ── Active processes header ──

  const activeProcesses: { type: string; label: string; elapsed: string; progress?: number }[] = [];

  if (availRun) {
    const elapsed = Math.round((Date.now() - new Date(availRun.started_at).getTime()) / 1000);
    activeProcesses.push({
      type: 'availability',
      label: `בדיקת זמינות — ${availDetails.length} נבדקו`,
      elapsed: elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`,
    });
  }

  if (backfillRun) {
    const elapsed = Math.round((Date.now() - new Date(backfillRun.started_at!).getTime()) / 1000);
    const pct = backfillRun.total_items ? Math.round(((backfillRun.processed_items ?? 0) / backfillRun.total_items) * 100) : undefined;
    activeProcesses.push({
      type: 'backfill',
      label: `השלמת נתונים — ${backfillRun.processed_items ?? 0}/${backfillRun.total_items ?? '?'}`,
      elapsed: elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`,
      progress: pct,
    });
  }

  scanRuns?.forEach(run => {
    const elapsed = Math.round((Date.now() - new Date(run.started_at).getTime()) / 1000);
    const pages = run.page_stats as unknown as PageStat[] | null;
    const done = pages?.filter(p => p.status !== 'pending').length || 0;
    const total = pages?.length || 0;
    activeProcesses.push({
      type: 'scan',
      label: `סריקת ${run.source || '?'} — עמ׳ ${done}/${total} | ${run.properties_found ?? 0} נמצאו, ${run.new_properties ?? 0} חדשים`,
      elapsed: elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`,
      progress: total > 0 ? Math.round((done / total) * 100) : undefined,
    });
  });

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [feedItems.length]);

  return (
    <div className="rounded-lg border border-border/50 bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-gray-900/80">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-gray-300">מוניטור חי</span>
          {hasActivity && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          )}
        </div>
        {!hasActivity && (
          <span className="text-[10px] text-gray-500">אין פעילות כרגע</span>
        )}
      </div>

      {/* Active processes bar */}
      {activeProcesses.length > 0 && (
        <div className="px-3 py-2 space-y-1.5 border-b border-border/20 bg-gray-900/50">
          {activeProcesses.map((proc, i) => {
            const cfg = typeConfig[proc.type as keyof typeof typeConfig];
            const Icon = cfg?.icon || Monitor;
            return (
              <div key={i} className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                <Icon className="h-3 w-3 text-gray-400" />
                <span className="text-sm text-gray-300 flex-1 truncate">{proc.label}</span>
                <span className="text-xs text-gray-500 font-mono">{proc.elapsed}</span>
                {proc.progress !== undefined && (
                  <div className="w-20">
                    <Progress value={proc.progress} className="h-1 [&>div]:bg-emerald-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Feed */}
      <div
        ref={scrollRef}
        className="h-[300px] overflow-y-auto scrollbar-thin"
        dir="rtl"
      >
        {feedItems.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-600">
            <div className="text-center space-y-1">
              <Monitor className="h-6 w-6 mx-auto opacity-30" />
              <p className="text-xs">ממתין לפעילות...</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/10">
            {feedItems.map((item, i) => {
              const cfg = typeConfig[item.type];
              const Icon = cfg.icon;
              const isLast = i === feedItems.length - 1;

              return (
                <div
                  key={`${item.type}-${i}`}
                  className={`${cfg.bgClass} ${isLast ? 'animate-pulse-once' : ''} transition-colors hover:bg-gray-800/40`}
                >
                  {/* Primary line */}
                  <div className="flex items-center gap-2 px-4 py-2 pb-1">
                    {/* Timestamp */}
                    <span className="text-xs text-gray-600 font-mono shrink-0 w-[55px]" dir="ltr">
                      {item.timestamp
                        ? format(new Date(item.timestamp), 'HH:mm:ss')
                        : '--:--:--'}
                    </span>

                    {/* Type icon */}
                    <Icon className="h-4 w-4 text-gray-500 shrink-0" />

                    {/* Status icon */}
                    <span className="shrink-0">{statusIcon(item.status)}</span>

                    {/* Primary text - clickable link if url exists */}
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-200 flex-1 truncate font-semibold hover:underline hover:text-gray-100 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        {item.primary}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-200 flex-1 truncate font-semibold">
                        {item.primary}
                      </span>
                    )}

                    {/* Source badge */}
                    {item.source && <span className="shrink-0">{sourceBadge(item.source)}</span>}

                    {/* Extra info */}
                    {item.extra?.price && (
                      <span className="text-xs text-gray-500 shrink-0">
                        ₪{(item.extra.price / 1000).toFixed(0)}K
                      </span>
                    )}
                    {item.extra?.rooms && (
                      <span className="text-xs text-gray-500 shrink-0">
                        {item.extra.rooms}ח׳
                      </span>
                    )}
                    {item.extra?.floor !== undefined && item.extra.floor !== null && (
                      <span className="text-xs text-gray-500 shrink-0">
                        ק׳{item.extra.floor}
                      </span>
                    )}
                  </div>

                  {/* Detail line */}
                  <div className="flex items-center gap-2 px-4 pb-2 pr-[80px]">
                    <span className="text-xs text-gray-500 truncate">
                      {item.details}
                    </span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-gray-600 hover:text-gray-400 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer summary */}
      {feedItems.length > 0 && (
        <div className="px-3 py-1.5 border-t border-border/20 bg-gray-900/50 flex items-center gap-3 text-[10px] text-gray-500">
          <span>{feedItems.length} פעולות</span>
          <span>✓ {feedItems.filter(f => f.status === 'ok').length}</span>
          <span className="text-red-400/70">✗ {feedItems.filter(f => f.status === 'error').length}</span>
          <span className="text-yellow-400/70">⚠ {feedItems.filter(f => f.status === 'warning').length}</span>
        </div>
      )}
    </div>
  );
};
