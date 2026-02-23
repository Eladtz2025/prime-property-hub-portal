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
    // When status is 'completed', auto-clear the error field to prevent
    // stale errors from causing the run to be marked as 'partial'
    const cleanedUpdates = { ...updates };
    if (cleanedUpdates.status === 'completed') {
      cleanedUpdates.error = undefined;
    }
    pageStats[idx] = {
      ...pageStats[idx],
      ...cleanedUpdates
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
    .select('page_stats, status, config_id, properties_found, new_properties, started_at')
    .eq('id', runId)
    .single();

  if (!run || run.status !== 'running') return;

  const pageStats: PageStat[] = run.page_stats || [];
  const terminalPages = pageStats.filter(p => 
    p.status === 'completed' || p.status === 'failed' || p.status === 'blocked'
  );
  const completedPages = terminalPages.length;
  
  // Check for stuck pages: scraping or pending pages with no active processing
  const scrapingPages = pageStats.filter(p => p.status === 'scraping');
  const pendingPages = pageStats.filter(p => p.status === 'pending');
  const activePages = scrapingPages.length;
  
  // How long the run has been active (ms)
  const runAgeMs = Date.now() - new Date(run.started_at).getTime();
  // Minimum age before declaring broken chain (2 minutes) — 
  // prevents false positives in parallel mode where pages are triggered with delays
  const MIN_AGE_FOR_BROKEN_CHAIN_MS = 120_000;
  
  // Case 1: Some pages stuck in 'scraping' and all others are done — mark as failed
  if (scrapingPages.length > 0 && completedPages + scrapingPages.length >= maxPages) {
    console.warn(`⚠️ ${source} run ${runId}: ${scrapingPages.length} pages stuck in 'scraping' — marking as failed`);
    for (const stuckPage of scrapingPages) {
      const idx = pageStats.findIndex(p => p.page === stuckPage.page);
      if (idx !== -1) {
        pageStats[idx] = { ...pageStats[idx], status: 'failed' as const, error: 'stuck_in_scraping_status' };
      }
    }
    await supabase.from('scout_runs').update({ page_stats: pageStats }).eq('id', runId);
  } 
  // Case 2: Broken chain — pages are pending but nothing is scraping (chain died)
  // Only trigger if run is old enough (>2 min) to avoid false positives in parallel mode
  else if (pendingPages.length > 0 && activePages === 0 && completedPages > 0 && runAgeMs > MIN_AGE_FOR_BROKEN_CHAIN_MS) {
    console.warn(`⚠️ ${source} run ${runId}: ${pendingPages.length} pages stuck in 'pending' (broken chain, age: ${Math.round(runAgeMs/1000)}s) — marking as failed`);
    for (const stuckPage of pendingPages) {
      const idx = pageStats.findIndex(p => p.page === stuckPage.page);
      if (idx !== -1) {
        pageStats[idx] = { ...pageStats[idx], status: 'failed' as const, error: 'broken_chain_never_triggered' };
      }
    }
    await supabase.from('scout_runs').update({ page_stats: pageStats }).eq('id', runId);
  }
  // Case 3: Still actively processing or too young to declare broken — not done yet
  else if (completedPages < maxPages) {
    return;
  }

  // All pages done - finalize
  const hasErrors = pageStats.some(p => p.status === 'failed' || p.status === 'blocked');
  const finalStatus = hasErrors ? 'partial' : 'completed';

  try {
    const { error: updateError } = await supabase
      .from('scout_runs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString()
      })
      .eq('id', runId);

    if (updateError) {
      console.error(`❌ Failed to finalize run ${runId}:`, updateError);
    }

    // Update config last run
    if (run.config_id) {
      const { error: configError } = await supabase
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

      if (configError) {
        console.error(`❌ Failed to update config for run ${runId}:`, configError);
      }
    }

    console.log(`✅ ${source} run ${runId} finalized with status: ${finalStatus}`);
  } catch (finalizeError) {
    console.error(`❌ Finalization error for run ${runId}:`, finalizeError);
    // Emergency finalization attempt
    try {
      await supabase.from('scout_runs')
        .update({ status: 'partial', completed_at: new Date().toISOString() })
        .eq('id', runId);
    } catch (emergencyError) {
      console.error(`❌ Emergency finalization also failed for run ${runId}:`, emergencyError);
    }
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
