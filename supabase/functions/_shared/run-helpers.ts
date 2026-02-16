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
  const terminalPages = pageStats.filter(p => 
    p.status === 'completed' || p.status === 'failed' || p.status === 'blocked'
  );
  const completedPages = terminalPages.length;
  
  // Check for stuck pages: scraping or pending pages with no active processing
  const scrapingPages = pageStats.filter(p => p.status === 'scraping');
  const pendingPages = pageStats.filter(p => p.status === 'pending');
  const activePages = scrapingPages.length; // pages currently being processed
  
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
    // Now all pages are in terminal state — continue to retry/finalize logic below
  } 
  // Case 2: Broken chain — pages are pending but nothing is scraping (chain died)
  else if (pendingPages.length > 0 && activePages === 0 && completedPages > 0) {
    console.warn(`⚠️ ${source} run ${runId}: ${pendingPages.length} pages stuck in 'pending' (broken chain) — marking as failed`);
    for (const stuckPage of pendingPages) {
      const idx = pageStats.findIndex(p => p.page === stuckPage.page);
      if (idx !== -1) {
        pageStats[idx] = { ...pageStats[idx], status: 'failed' as const, error: 'broken_chain_never_triggered' };
      }
    }
    await supabase.from('scout_runs').update({ page_stats: pageStats }).eq('id', runId);
    // Continue to retry/finalize logic below
  }
  // Case 3: Still actively processing — not done yet
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
        // Increment retry count
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
      
      // Save updated page_stats with retry counts
      await supabase
        .from('scout_runs')
        .update({ page_stats: pageStats })
        .eq('id', runId);
      
      // Trigger the first failed page (it will chain to the next)
      const firstRetry = failedPages[0];
      console.log(`🔄 Retrying page ${firstRetry.page} (attempt ${(firstRetry.retry_count || 0) + 1})`);
      
      // Wait before retrying to give CAPTCHA time to clear
      await new Promise(r => setTimeout(r, 15000));
      
      const configId = run.config_id;
      const startPage = pageStats[0]?.page || 1;
      
      try {
        await fetch(`${supabaseUrl}/functions/v1/scout-${source}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            config_id: configId,
            page: firstRetry.page,
            run_id: runId,
            max_pages: pageStats[pageStats.length - 1]?.page || maxPages,
            start_page: startPage,
            is_retry: true,
            retry_pages: failedPages.slice(1).map(p => p.page) // remaining pages to retry
          })
        });
      } catch (err) {
        console.error(`❌ Failed to trigger retry for page ${firstRetry.page}:`, err);
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
