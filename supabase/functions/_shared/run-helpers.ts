/**
 * Shared helper functions for scout run management
 * Used by all scout functions (yad2, madlan, homeless) for consistent run handling
 */

export interface PageStat {
  page: number;
  url: string;
  status: 'pending' | 'scraping' | 'completed' | 'failed' | 'blocked';
  found: number;
  new: number;
  duration_ms: number;
  error?: string;
}

/**
 * Create initial page_stats array for a run
 * @param maxPages - Total pages to scan (e.g., 4)
 * @param startPage - First page to scan (default 1, Madlan uses 2)
 */
export function createInitialPageStats(maxPages: number, startPage: number = 1): PageStat[] {
  const pages: PageStat[] = [];
  for (let i = startPage; i <= maxPages; i++) {
    pages.push({
      page: i,
      url: '',
      status: 'pending' as const,
      found: 0,
      new: 0,
      duration_ms: 0
    });
  }
  return pages;
}

/**
 * Update the status of a specific page in page_stats
 */
export async function updatePageStatus(
  supabase: any, 
  runId: string, 
  page: number, 
  updates: { 
    status?: PageStat['status']; 
    url?: string;
    found?: number; 
    new?: number; 
    duration_ms?: number;
    error?: string;
  }
): Promise<void> {
  const { data: run } = await supabase
    .from('scout_runs')
    .select('page_stats')
    .eq('id', runId)
    .single();

  if (!run?.page_stats) return;

  const pageStats = [...run.page_stats];
  const idx = pageStats.findIndex(p => p.page === page);

  if (idx !== -1) {
    pageStats[idx] = {
      ...pageStats[idx],
      ...updates
    };

    await supabase
      .from('scout_runs')
      .update({ page_stats: pageStats })
      .eq('id', runId);
  } else {
    console.warn(`[updatePageStatus] Page ${page} not found in page_stats for run ${runId}`);
  }
}

/**
 * Increment run totals (properties_found, new_properties)
 * Uses atomic increment to avoid race conditions between parallel page scrapes
 */
export async function incrementRunStats(
  supabase: any,
  runId: string,
  found: number,
  newCount: number
): Promise<void> {
  // Try RPC first for atomic increment
  const { error: rpcError } = await supabase.rpc('increment_scout_run_stats', {
    p_run_id: runId,
    p_found: found,
    p_new: newCount
  });

  if (rpcError) {
    // Fallback if RPC doesn't exist - direct update with current values
    const { data: currentRun } = await supabase
      .from('scout_runs')
      .select('properties_found, new_properties')
      .eq('id', runId)
      .single();
    
    if (currentRun) {
      await supabase
        .from('scout_runs')
        .update({
          properties_found: (currentRun.properties_found || 0) + found,
          new_properties: (currentRun.new_properties || 0) + newCount
        })
        .eq('id', runId);
    }
  }
}

/**
 * Check if all pages are done and finalize the run
 * If new properties were found, triggers automatic backfill for feature extraction
 */
export async function checkAndFinalizeRun(
  supabase: any, 
  runId: string, 
  maxPages: number,
  source: string
): Promise<void> {
  const { data: run } = await supabase
    .from('scout_runs')
    .select('page_stats, status, config_id, properties_found, new_properties')
    .eq('id', runId)
    .single();

  if (!run || run.status !== 'running') return;

  const pageStats: PageStat[] = run.page_stats || [];
  const completedPages = pageStats.filter(p => 
    p.status === 'completed' || p.status === 'failed' || p.status === 'blocked'
  ).length;

  // Check if all pages are done
  if (completedPages >= maxPages) {
    const hasErrors = pageStats.some(p => p.status === 'failed' || p.status === 'blocked');
    const finalStatus = hasErrors ? 'partial' : 'completed';

    await supabase
      .from('scout_runs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString()
      })
      .eq('id', runId);

    // Update config last run
    if (run.config_id) {
      await supabase
        .from('scout_configs')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: finalStatus,
          last_run_results: { 
            properties_found: run.properties_found || 0,
            new_properties: run.new_properties || 0
          }
        })
        .eq('id', run.config_id);
    }

    console.log(`✅ ${source} run ${runId} finalized with status: ${finalStatus}`);

    // AUTO-BACKFILL: If new properties were found, trigger backfill for feature extraction
    const newPropertiesCount = run.new_properties || 0;
    if (newPropertiesCount > 0) {
      console.log(`🔄 Triggering auto-backfill for ${newPropertiesCount} new properties from ${source}...`);
      await triggerAutoBackfill(supabase, runId, source, newPropertiesCount);
    }
  }
}

/**
 * Trigger automatic backfill for new properties after a scout run
 * Only processes properties that were created by this run (last 30 minutes)
 */
async function triggerAutoBackfill(
  supabase: any,
  runId: string,
  source: string,
  newCount: number
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Cannot trigger auto-backfill: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return;
    }

    // Call backfill function with source filter to only process recent properties
    const response = await fetch(`${supabaseUrl}/functions/v1/backfill-property-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        source_filter: source, // Only process properties from this source
        only_recent: true,     // Only process properties created in last 30 min
        batch_size: Math.min(newCount, 25), // Process up to 25 at a time
        auto_trigger: true,    // Flag to identify auto-triggered runs
        run_id: runId          // Reference to the scout run
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Auto-backfill triggered: ${result.processed || 0} properties queued`);
    } else {
      const error = await response.text();
      console.error(`❌ Auto-backfill failed: ${error}`);
    }
  } catch (err) {
    console.error('❌ Auto-backfill error:', err);
  }
}

/**
 * Check if a run was stopped
 */
export async function isRunStopped(supabase: any, runId: string): Promise<boolean> {
  const { data: run } = await supabase
    .from('scout_runs')
    .select('status')
    .eq('id', runId)
    .single();
  
  return run?.status === 'stopped';
}
