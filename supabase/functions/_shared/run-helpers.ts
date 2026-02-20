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
  retry_count?: number;
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
    .select('page_stats, status, config_id, properties_found, new_properties, created_at')
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
  const runAgeMs = Date.now() - new Date(run.created_at).getTime();
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

  // Check for failed/blocked pages that haven't been retried yet
  const failedPages = pageStats.filter(p => 
    (p.status === 'failed' || p.status === 'blocked') && (!p.retry_count || p.retry_count < 2)
  );

  if (failedPages.length > 0) {
    // Retry failed pages before finalizing
    console.log(`🔄 ${source} run ${runId}: ${failedPages.length} failed pages to retry`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      for (const failedPage of failedPages) {
        const idx = pageStats.findIndex(p => p.page === failedPage.page);
        if (idx !== -1) {
          pageStats[idx] = {
            ...pageStats[idx],
            status: 'pending' as const,
            retry_count: (pageStats[idx].retry_count || 0) + 1,
            error: undefined
          };
        }
      }
      
      await supabase
        .from('scout_runs')
        .update({ page_stats: pageStats })
        .eq('id', runId);
      
      const configId = run.config_id;
      const startPage = pageStats[0]?.page || 1;
      
      // Determine the correct function name — source may already include '-jina'
      const functionName = source.includes('-jina') 
        ? `scout-${source}` 
        : `scout-${source}-jina`;
      
      // For parallel-mode scanners (homeless), trigger each failed page independently
      // For sequential scanners (yad2, madlan), chain via is_retry/retry_pages
      const isParallelSource = source.startsWith('homeless');
      
      if (isParallelSource) {
        // Fire-and-forget each failed page with a small delay between them
        for (let i = 0; i < failedPages.length; i++) {
          const fp = failedPages[i];
          console.log(`🔄 Retrying page ${fp.page} (attempt ${(fp.retry_count || 0) + 1}) [parallel]`);
          try {
            await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
              body: JSON.stringify({ config_id: configId, page: fp.page, run_id: runId, max_pages: pageStats[pageStats.length - 1]?.page || maxPages })
            });
          } catch (err) {
            console.error(`❌ Failed to trigger retry for page ${fp.page}:`, err);
          }
          if (i < failedPages.length - 1) await new Promise(r => setTimeout(r, 3000));
        }
      } else {
        // Sequential: chain retries via is_retry mechanism
        const firstRetry = failedPages[0];
        console.log(`🔄 Retrying page ${firstRetry.page} (attempt ${(firstRetry.retry_count || 0) + 1}) [sequential]`);
        await new Promise(r => setTimeout(r, 15000));
        try {
          await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
            body: JSON.stringify({
              config_id: configId, page: firstRetry.page, run_id: runId,
              max_pages: pageStats[pageStats.length - 1]?.page || maxPages,
              start_page: startPage, is_retry: true,
              retry_pages: failedPages.slice(1).map(p => p.page)
            })
          });
        } catch (err) {
          console.error(`❌ Failed to trigger retry for page ${firstRetry.page}:`, err);
        }
      }
      
      return; // Don't finalize yet - retries in progress
    }
  }

  // All pages done (including retries) - finalize
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
