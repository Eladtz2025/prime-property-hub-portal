import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

// ── Types ──

export interface AvailDetail {
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

export interface PageStat {
  page: number;
  url: string;
  found: number;
  new: number;
  duration_ms: number;
  status: string;
  error?: string;
  retry_count?: number;
}

export interface BackfillSummary {
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

export interface BackfillRecentItem {
  address?: string;
  neighborhood?: string;
  source?: string;
  source_url?: string;
  status: string;
  fields_found?: string[];
  fields_updated?: string[];
  broker_result?: string | null;
  address_action?: string | null;
  timestamp: string;
}

export interface DedupSummary {
  duplicates_found?: number;
  groups_created?: number;
  batches?: number;
  recent_batches?: DedupBatchItem[];
}

export interface DedupBatchItem {
  batch: number;
  processed: number;
  duplicates: number;
  groups: number;
  timestamp: string;
}

export interface FeedItem {
  type: 'availability' | 'scan' | 'backfill' | 'dedup' | 'matching';
  timestamp: string;
  primary: string;
  details: string;
  source?: string;
  status: 'ok' | 'error' | 'warning' | 'pending';
  url?: string;
  extra?: { price?: number; rooms?: number; floor?: number };
  eventKind?: 'found' | 'matched' | 'timeout' | 'pushed' | 'skipped' | 'checked' | 'inactive' | 'error';
}

export interface PipelineStage {
  key: string;
  label: string;
  processed: number;
  waiting: number;
  failed: number;
  avgLatency: number | null;
  progressPct: number;
}

export interface MonitorAlert {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
}

// ── Helpers ──

const STRIP_CITY_PATTERNS = [
  /,?\s*תל[\s-]*אביב[\s-]*יפו/gi,
  /,?\s*תל[\s-]*אביב/gi,
  /,?\s*Tel\s*Aviv/gi,
  /,?\s*Jaffa/gi,
  /,?\s*יפו/gi,
];

export const formatCleanAddress = (address?: string, neighborhood?: string): string => {
  if (!address) return '?';
  let street = address.split(',')[0]?.trim() || address;
  street = street.replace(/^דירה\s*\d*\s*חדרי?ם?\s*(להשכרה|למכירה)\s*ב?/i, '').trim();
  street = street.replace(/^(להשכרה|למכירה)\s*ב?/i, '').trim();
  street = street.replace(/^אזורי?\s*/i, '').trim();
  for (const p of STRIP_CITY_PATTERNS) {
    street = street.replace(p, '').trim();
  }
  street = street.replace(/,\s*$/, '').trim();
  if (!street) return neighborhood || '?';
  return neighborhood ? `${street}, ${neighborhood}` : street;
};

export const truncateUrl = (url?: string) => {
  if (!url) return '';
  try {
    const u = new URL(url);
    const path = u.pathname.length > 30 ? u.pathname.slice(0, 30) + '…' : u.pathname;
    return u.hostname.replace('www.', '') + path;
  } catch { return url.slice(0, 50); }
};

export const availReasonDetail = (reason: string, isInactive: boolean): { label: string; detail: string; status: FeedItem['status'] } => {
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

const taskNameConfig: Record<string, { label: string; feedType: FeedItem['type'] }> = {
  'data_completion': { label: 'השלמת נתונים', feedType: 'backfill' },
  'dedup-scan': { label: 'סריקת כפילויות', feedType: 'dedup' },
  'reclassify_broker': { label: 'סיווג מתווך', feedType: 'backfill' },
  'backfill_broker_classification': { label: 'סיווג מתווך', feedType: 'backfill' },
};

const getTaskConfig = (taskName: string) => {
  if (taskNameConfig[taskName]) return taskNameConfig[taskName];
  if (taskName.startsWith('data_completion_auto_')) {
    const source = taskName.replace('data_completion_auto_', '').toUpperCase();
    return { label: `השלמה אוטו ${source}`, feedType: 'backfill' as FeedItem['type'] };
  }
  return { label: taskName, feedType: 'backfill' as FeedItem['type'] };
};

// ── Hook ──

export function useMonitorData() {
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

  // Backfill tasks (running)
  const { data: backfillRuns } = useQuery({
    queryKey: ['monitor-backfill-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backfill_progress')
        .select('*')
        .eq('status', 'running')
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 2000,
  });

  // Completed backfill tasks today (for dailyRunsHealth)
  const { data: completedBackfillToday } = useQuery({
    queryKey: ['monitor-completed-backfill-today'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('backfill_progress')
        .select('task_name, started_at, completed_at, status')
        .eq('status', 'completed')
        .gte('started_at', today.toISOString())
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Yesterday's scout scans (for yesterdayScansHealth)
  const { data: yesterdayScans } = useQuery({
    queryKey: ['monitor-yesterday-scans'],
    queryFn: async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      const { data, error } = await supabase
        .from('scout_runs')
        .select('source, status, properties_found, new_properties, started_at, completed_at')
        .gte('started_at', yesterday.toISOString())
        .lte('started_at', endOfYesterday.toISOString())
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  // Scan runs
  const { data: scanRuns } = useQuery({
    queryKey: ['monitor-scan-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_runs')
        .select('id, started_at, status, source, config_id, properties_found, new_properties, page_stats, scout_configs(name, max_pages)')
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    refetchInterval: 2000,
  });

  // Recent scout runs for pipeline stats (last 24h)
  const { data: recentScoutRuns } = useQuery({
    queryKey: ['monitor-recent-scout-runs'],
    queryFn: async () => {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('scout_runs')
        .select('source, properties_found, new_properties, started_at, completed_at, status, page_stats')
        .gte('started_at', since.toISOString())
        .order('started_at', { ascending: false });
      return data ?? [];
    },
    refetchInterval: 15000,
  });

  // Recent availability runs for pipeline
  const { data: recentAvailRuns } = useQuery({
    queryKey: ['monitor-recent-avail-runs'],
    queryFn: async () => {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('availability_check_runs')
        .select('started_at, completed_at, properties_checked, inactive_marked, status, run_details')
        .gte('started_at', since.toISOString())
        .order('started_at', { ascending: false });
      return data ?? [];
    },
    refetchInterval: 15000,
  });

  // Last matching run
  const { data: lastMatchRun } = useQuery({
    queryKey: ['monitor-last-match-run'],
    queryFn: async () => {
      const { data } = await supabase
        .from('scout_runs')
        .select('*')
        .eq('source', 'matching')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    refetchInterval: 15000,
  });

  // Properties created today (for pipeline)
  const { data: newPropsToday } = useQuery({
    queryKey: ['monitor-new-props-today'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('scouted_properties')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      return count ?? 0;
    },
    refetchInterval: 15000,
  });

  // ── Build feed items (include completed runs so screen is never empty) ──
  const feedItems = useMemo(() => {
    const items: FeedItem[] = [];

    // Availability details — from running run OR last completed run
    const availSource = availRun ?? recentAvailRuns?.[0];
    const availDetails: AvailDetail[] = availSource?.run_details
      ? (Array.isArray(availSource.run_details) ? availSource.run_details as unknown as AvailDetail[] : [])
      : [];

    availDetails.forEach(d => {
      const { label, detail, status } = availReasonDetail(d.reason, d.is_inactive);
      const eventKind: FeedItem['eventKind'] = d.is_inactive ? 'inactive' : d.reason.includes('timeout') ? 'timeout' : 'checked';
      items.push({
        type: 'availability',
        timestamp: d.checked_at || '',
        primary: formatCleanAddress(d.address, d.neighborhood) || d.property_id?.slice(0, 8) || '?',
        details: `${truncateUrl(d.source_url)} | ${detail} | ${label}`,
        source: d.source,
        status,
        url: d.source_url,
        extra: { price: d.price, rooms: d.rooms, floor: d.floor },
        eventKind,
      });
    });

    // Scan runs — from running OR recent completed
    const scanSource = (scanRuns && scanRuns.length > 0) ? scanRuns : recentScoutRuns?.slice(0, 3) ?? [];
    scanSource.forEach(run => {
      const config = (run as any).scout_configs;
      const pages = run.page_stats as unknown as PageStat[] | null;
      if (!pages || pages.length === 0) return;

      const maxPages = config?.max_pages || 8;
      const completedPages = pages.filter(p => p.status === 'completed');
      const failedPages = pages.filter(p => p.status === 'failed' || p.status === 'blocked');
      const donePagesCount = pages.filter(p => ['completed', 'failed', 'blocked'].includes(p.status)).length;
      const totalFound = pages.reduce((s, p) => s + (p.found || 0), 0);
      const totalNew = pages.reduce((s, p) => s + (p.new || 0), 0);

      items.push({
        type: 'scan',
        timestamp: run.started_at,
        primary: `סריקת ${config?.name || run.source} — עמ׳ ${donePagesCount}/${maxPages}`,
        details: `${totalFound} נמצאו | ${totalNew} חדשים | ${completedPages.length} תקינים${failedPages.length > 0 ? ` | ${failedPages.length} נכשלו` : ''}`,
        source: run.source,
        status: failedPages.length > 0 ? 'warning' : 'ok',
        eventKind: 'found',
      });

      failedPages.forEach(p => {
        items.push({
          type: 'scan',
          timestamp: run.started_at,
          primary: `עמ׳ ${p.page} — ${p.error || 'שגיאה'}`,
          details: truncateUrl(p.url),
          source: run.source,
          status: 'error',
          eventKind: 'error',
        });
      });
    });

    // Backfill per-task
    backfillRuns?.forEach(run => {
      const taskCfg = getTaskConfig(run.task_name);
      const summary = run.summary_data as unknown as (BackfillSummary & DedupSummary) | null;

      if (taskCfg.feedType === 'dedup') {
        const recentBatches = summary?.recent_batches || [];
        if (recentBatches.length > 0) {
          const lastBatch = recentBatches[recentBatches.length - 1];
          const totalProcessed = run.processed_items ?? 0;
          const totalDups = run.successful_items ?? 0;
          const totalBatches = summary?.batches ?? recentBatches.length;
          items.push({
            type: 'dedup',
            timestamp: lastBatch.timestamp,
            primary: `סריקת כפילויות — באצ׳ ${lastBatch.batch}/${totalBatches}`,
            details: `${totalProcessed.toLocaleString('he-IL')} נבדקו | ${totalDups.toLocaleString('he-IL')} כפילויות`,
            status: run.status === 'completed' ? 'ok' : 'warning',
            eventKind: 'found',
          });
        }
      } else {
        const recentItems = summary?.recent_items || [];
        recentItems.forEach(item => {
          const statusMap: Record<string, FeedItem['status']> = {
            ok: 'ok', no_new_data: 'warning', scrape_failed: 'error',
            no_content: 'error', blacklisted: 'error', update_error: 'error',
          };

          const detailParts: string[] = [];
          if (item.status === 'ok') {
            if (item.fields_found?.length) detailParts.push(`נמצאו: ${item.fields_found.join(', ')}`);
            if (item.fields_updated?.length) detailParts.push(`עודכנו: ${item.fields_updated.join(', ')}`);
            if (item.broker_result) detailParts.push(`סיווג: ${item.broker_result === 'private' ? 'פרטי' : 'תיווך'}`);
            if (item.address_action === 'upgraded') detailParts.push('כתובת שודרגה');
            if (item.address_action === 'set_new') detailParts.push('כתובת חדשה');
          } else if (item.status === 'no_new_data') {
            if (item.fields_found?.length) detailParts.push(`נמצאו: ${item.fields_found.join(', ')}`);
            detailParts.push('ללא נתונים חדשים');
          } else if (item.status === 'scrape_failed') {
            detailParts.push('Scrape failed');
          } else if (item.status === 'no_content') {
            detailParts.push('אין תוכן בדף');
          } else if (item.status === 'blacklisted') {
            detailParts.push('מיקום מחוץ לת"א — בוטל');
          } else if (item.status === 'update_error') {
            detailParts.push('שגיאת עדכון DB');
          }

          items.push({
            type: 'backfill',
            timestamp: item.timestamp,
            primary: formatCleanAddress(item.address, item.neighborhood),
            details: detailParts.join(' | ') || item.status,
            source: item.source,
            status: statusMap[item.status] || 'warning',
            url: item.source_url,
            eventKind: item.status === 'ok' ? 'pushed' : item.status === 'no_new_data' ? 'skipped' : 'error',
          });
        });
      }
    });

    items.sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    return items;
  }, [availRun, scanRuns, backfillRuns, recentAvailRuns, recentScoutRuns]);

  // ── Active processes ──
  const activeProcesses = useMemo(() => {
    const procs: { type: string; label: string; elapsed: string; progress?: number }[] = [];
    const availDetails: AvailDetail[] = availRun?.run_details
      ? (Array.isArray(availRun.run_details) ? availRun.run_details as unknown as AvailDetail[] : [])
      : [];

    if (availRun) {
      const elapsed = Math.round((Date.now() - new Date(availRun.started_at).getTime()) / 1000);
      procs.push({
        type: 'availability',
        label: `בדיקת זמינות — ${availDetails.length} נבדקו`,
        elapsed: elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`,
      });
    }

    backfillRuns?.forEach(run => {
      const taskCfg = getTaskConfig(run.task_name);
      const elapsed = Math.round((Date.now() - new Date(run.started_at!).getTime()) / 1000);
      const pct = run.total_items ? Math.round(((run.processed_items ?? 0) / run.total_items) * 100) : undefined;
      procs.push({
        type: taskCfg.feedType,
        label: `${taskCfg.label} — ${run.processed_items ?? 0}/${run.total_items ?? '?'}`,
        elapsed: elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`,
        progress: pct,
      });
    });

    scanRuns?.forEach(run => {
      const config = (run as any).scout_configs;
      const maxPages = config?.max_pages || 8;
      const configName = config?.name || run.source || '?';
      const elapsed = Math.round((Date.now() - new Date(run.started_at).getTime()) / 1000);
      const pages = run.page_stats as unknown as PageStat[] | null;
      const done = pages?.filter(p => ['completed', 'failed', 'blocked'].includes(p.status)).length || 0;
      procs.push({
        type: 'scan',
        label: `סריקת ${configName} — עמ׳ ${done}/${maxPages} | ${run.properties_found ?? 0} נמצאו, ${run.new_properties ?? 0} חדשים`,
        elapsed: elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`,
        progress: Math.round((done / maxPages) * 100),
      });
    });

    return procs;
  }, [availRun, backfillRuns, scanRuns]);

  // ── Pipeline stages ──
  const pipelineStages = useMemo((): PipelineStage[] => {
    // Scraping
    const scrapingProcessed = recentScoutRuns?.reduce((s, r) => s + (r.properties_found ?? 0), 0) ?? 0;
    const scrapingNew = recentScoutRuns?.reduce((s, r) => s + (r.new_properties ?? 0), 0) ?? 0;
    const scrapingFailed = recentScoutRuns?.filter(r => r.status === 'failed').length ?? 0;
    const scrapingRunning = scanRuns?.length ?? 0;
    const scrapingLatencies = recentScoutRuns?.flatMap(r => {
      const pages = r.page_stats as unknown as PageStat[] | null;
      return pages?.filter(p => p.duration_ms)?.map(p => p.duration_ms) ?? [];
    }) ?? [];
    const avgScrapingLatency = scrapingLatencies.length > 0
      ? Math.round(scrapingLatencies.reduce((a, b) => a + b, 0) / scrapingLatencies.length)
      : null;

    // Availability
    const availProcessed = recentAvailRuns?.reduce((s, r) => s + (r.properties_checked ?? 0), 0) ?? 0;
    const availInactive = recentAvailRuns?.reduce((s, r) => s + (r.inactive_marked ?? 0), 0) ?? 0;
    const availRunning = availRun ? 1 : 0;
    const availTimeouts = recentAvailRuns?.flatMap(r => {
      const details = r.run_details as unknown as AvailDetail[] | null;
      return details?.filter(d => d.reason?.includes('timeout')) ?? [];
    }).length ?? 0;

    // Matching
    const matchProcessed = lastMatchRun?.leads_matched ?? 0;
    const matchFailed = lastMatchRun?.status === 'failed' ? 1 : 0;

    // Backfill/Push
    const backfillProcessed = backfillRuns?.reduce((s, r) => s + (r.processed_items ?? 0), 0) ?? 0;
    const backfillFailed = backfillRuns?.reduce((s, r) => s + (r.failed_items ?? 0), 0) ?? 0;

    return [
      {
        key: 'scraping',
        label: 'סריקה',
        processed: scrapingProcessed,
        waiting: scrapingRunning,
        failed: scrapingFailed,
        avgLatency: avgScrapingLatency,
        progressPct: scrapingProcessed > 0 ? Math.min(100, Math.round((scrapingNew / Math.max(scrapingProcessed, 1)) * 100)) : 0,
      },
      {
        key: 'availability',
        label: 'בדיקת זמינות',
        processed: availProcessed,
        waiting: availRunning,
        failed: availInactive,
        avgLatency: null,
        progressPct: availProcessed > 0 ? Math.round(((availProcessed - availTimeouts) / Math.max(availProcessed, 1)) * 100) : 0,
      },
      {
        key: 'matching',
        label: 'התאמות',
        processed: matchProcessed,
        waiting: lastMatchRun?.status === 'running' ? 1 : 0,
        failed: matchFailed,
        avgLatency: null,
        progressPct: matchProcessed > 0 ? 100 : 0,
      },
      {
        key: 'push',
        label: 'העשרה / Push',
        processed: backfillProcessed,
        waiting: backfillRuns?.length ?? 0,
        failed: backfillFailed,
        avgLatency: null,
        progressPct: backfillProcessed > 0 ? Math.round(((backfillProcessed - backfillFailed) / Math.max(backfillProcessed, 1)) * 100) : 0,
      },
    ];
  }, [recentScoutRuns, recentAvailRuns, lastMatchRun, backfillRuns, scanRuns, availRun]);

  // ── Alerts ──
  const alerts = useMemo((): MonitorAlert[] => {
    const result: MonitorAlert[] = [];
    const now = new Date();

    // Timeout spike in current availability run
    if (availRun?.run_details) {
      const details = availRun.run_details as unknown as AvailDetail[];
      if (Array.isArray(details) && details.length > 5) {
        const timeouts = details.filter(d => d.reason?.includes('timeout')).length;
        const rate = timeouts / details.length;
        if (rate > 0.2) {
          result.push({
            id: 'timeout-spike',
            severity: 'error',
            title: 'Timeout Spike',
            description: `${Math.round(rate * 100)}% מהבדיקות = timeout (${timeouts}/${details.length})`,
            timestamp: now.toISOString(),
          });
        }
      }
    }

    // Source stalled — no scan in 2h
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const recentSources = new Set(
      recentScoutRuns?.filter(r => new Date(r.started_at) > twoHoursAgo).map(r => r.source) ?? []
    );
    const allSources = new Set(recentScoutRuns?.map(r => r.source) ?? []);
    allSources.forEach(src => {
      if (src && !recentSources.has(src)) {
        result.push({
          id: `stalled-${src}`,
          severity: 'warning',
          title: `${src} לא פעיל`,
          description: `מקור ${src} לא נסרק ב-2 שעות האחרונות`,
          timestamp: now.toISOString(),
        });
      }
    });

    // 0 new listings in 2h
    if (recentScoutRuns && recentScoutRuns.length > 0) {
      const recentNew = recentScoutRuns
        .filter(r => new Date(r.started_at) > twoHoursAgo)
        .reduce((s, r) => s + (r.new_properties ?? 0), 0);
      if (recentNew === 0) {
        result.push({
          id: 'zero-listings',
          severity: 'warning',
          title: '0 נכסים חדשים',
          description: 'לא נמצאו נכסים חדשים ב-2 שעות האחרונות',
          timestamp: now.toISOString(),
        });
      }
    }

    // Match rate drop
    if (lastMatchRun?.leads_matched === 0 && lastMatchRun?.status === 'completed') {
      result.push({
        id: 'match-drop',
        severity: 'warning' as const,
        title: 'אפס התאמות',
        description: 'ריצת matching אחרונה הניבה 0 התאמות',
        timestamp: lastMatchRun.completed_at || now.toISOString(),
      });
    }

    // Push failures
    backfillRuns?.forEach(run => {
      if ((run.failed_items ?? 0) > 0) {
        result.push({
          id: `push-fail-${run.id}`,
          severity: 'error',
          title: `כשלונות ב-${getTaskConfig(run.task_name).label}`,
          description: `${run.failed_items} פריטים נכשלו מתוך ${run.processed_items ?? 0}`,
          timestamp: run.updated_at || now.toISOString(),
        });
      }
    });

    return result;
  }, [availRun, recentScoutRuns, lastMatchRun, backfillRuns]);

  // ── Intelligence metrics ──
  const intelligence = useMemo(() => {
    // Throughput: events per minute based on feed items in last 10 min
    const tenMinAgo = Date.now() - 10 * 60 * 1000;
    const recentFeed = feedItems.filter(f => f.timestamp && new Date(f.timestamp).getTime() > tenMinAgo);
    const throughput = recentFeed.length > 0 ? Math.round(recentFeed.length / 10) : 0;

    // Avg latency from scan page_stats
    const latencies = recentScoutRuns?.flatMap(r => {
      const pages = r.page_stats as unknown as PageStat[] | null;
      return pages?.filter(p => p.duration_ms)?.map(p => p.duration_ms) ?? [];
    }) ?? [];
    const avgLatency = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;

    // Timeout rate
    const availDetails = availRun?.run_details as unknown as AvailDetail[] | null;
    const totalChecked = Array.isArray(availDetails) ? availDetails.length : 0;
    const timeouts = Array.isArray(availDetails) ? availDetails.filter(d => d.reason?.includes('timeout')).length : 0;
    const timeoutRate = totalChecked > 0 ? Math.round((timeouts / totalChecked) * 100) : 0;

    // Active sources
    const activeSources = [...new Set([
      ...(scanRuns?.map(r => r.source) ?? []),
      ...(availRun ? ['availability'] : []),
      ...(backfillRuns?.map(r => 'backfill') ?? []),
    ])].filter(Boolean);

    // Sparkline data: throughput per minute for last 10 min
    const sparkline: number[] = [];
    for (let i = 9; i >= 0; i--) {
      const minStart = Date.now() - (i + 1) * 60 * 1000;
      const minEnd = Date.now() - i * 60 * 1000;
      sparkline.push(
        feedItems.filter(f => {
          const t = new Date(f.timestamp).getTime();
          return t >= minStart && t < minEnd;
        }).length
      );
    }

    return {
      throughput,
      avgLatency,
      timeoutRate,
      activeSources,
      hasAlerts: alerts.some(a => a.severity === 'error'),
      sparkline,
    };
  }, [feedItems, recentScoutRuns, availRun, scanRuns, backfillRuns, alerts]);

  const hasActivity = !!(availRun || (backfillRuns && backfillRuns.length > 0) || (scanRuns && scanRuns.length > 0));

  // Last event time
  const lastEventTime = feedItems.length > 0 ? feedItems[feedItems.length - 1].timestamp : null;

  // ── Daily runs health ──
  const dailyRunsHealth = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const formatTime = (ts: string) => {
      try {
        const d = new Date(ts);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      } catch { return ''; }
    };

    // Merge running + completed backfill runs from today
    const allBackfillToday = [
      ...(backfillRuns ?? []).filter(r => r.started_at && r.started_at >= todayStr),
      ...(completedBackfillToday ?? []),
    ];

    // 1. Data Completion
    const dcRun = allBackfillToday.find(r => r.task_name.startsWith('data_completion'));
    const dcOk = !!dcRun;
    const dcTime = dcRun?.started_at ? formatTime(dcRun.started_at) : '';

    // 2. Dedup
    const dedupRun = allBackfillToday.find(r => r.task_name === 'dedup-scan');
    const dedupOk = !!dedupRun;
    const dedupTime = dedupRun?.started_at ? formatTime(dedupRun.started_at) : '';

    // 3. Availability
    const availToday = (recentAvailRuns ?? []).filter(r => r.started_at >= todayStr);
    const availOk = availToday.length > 0 && availToday.some(r => r.status === 'completed' || r.status === 'running');
    const availTime = availToday[0]?.started_at ? formatTime(availToday[0].started_at) : '';

    // 4. Matching
    const matchToday = lastMatchRun && lastMatchRun.started_at && lastMatchRun.started_at >= todayStr;
    const matchOk = !!matchToday;
    const matchTime = lastMatchRun?.started_at && matchToday ? formatTime(lastMatchRun.started_at) : '';

    const details = [
      { name: 'השלמת נתונים', ok: dcOk, time: dcTime },
      { name: 'כפילויות', ok: dedupOk, time: dedupTime },
      { name: 'זמינות', ok: availOk, time: availTime },
      { name: 'התאמות', ok: matchOk, time: matchTime },
    ];

    return {
      passed: details.filter(d => d.ok).length,
      total: 4,
      details,
    };
  }, [backfillRuns, completedBackfillToday, recentAvailRuns, lastMatchRun]);

  // ── Yesterday scans health ──
  const yesterdayScansHealth = useMemo(() => {
    const scans = yesterdayScans ?? [];
    if (scans.length === 0) return { passed: 0, total: 0, details: [] as { name: string; ok: boolean; found: number; isNew: number; time: string }[] };

    const formatTime = (ts: string) => {
      try {
        const d = new Date(ts);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      } catch { return ''; }
    };

    // Group by source
    const bySource = new Map<string, typeof scans>();
    scans.forEach(s => {
      const src = s.source || 'unknown';
      if (!bySource.has(src)) bySource.set(src, []);
      bySource.get(src)!.push(s);
    });

    const details: { name: string; ok: boolean; found: number; isNew: number; time: string }[] = [];
    bySource.forEach((runs, source) => {
      const anyCompleted = runs.some(r => r.status === 'completed');
      const totalFound = runs.reduce((s, r) => s + (r.properties_found ?? 0), 0);
      const totalNew = runs.reduce((s, r) => s + (r.new_properties ?? 0), 0);
      const lastRun = runs[0];
      details.push({
        name: source,
        ok: anyCompleted,
        found: totalFound,
        isNew: totalNew,
        time: lastRun?.started_at ? formatTime(lastRun.started_at) : '',
      });
    });

    details.sort((a, b) => a.name.localeCompare(b.name));

    return {
      passed: details.filter(d => d.ok).length,
      total: details.length,
      details,
    };
  }, [yesterdayScans]);

  return {
    feedItems,
    activeProcesses,
    pipelineStages,
    alerts,
    intelligence,
    hasActivity,
    lastEventTime,
    newPropsToday: newPropsToday ?? 0,
    dailyRunsHealth,
    yesterdayScansHealth,
  };
}
