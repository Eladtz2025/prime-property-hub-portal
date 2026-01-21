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
 */
export function createInitialPageStats(maxPages: number): PageStat[] {
  return Array.from({ length: maxPages }, (_, i) => ({
    page: i + 1,
    url: '',
    status: 'pending' as const,
    found: 0,
    new: 0,
    duration_ms: 0
  }));
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
  const pageIndex = page - 1;
  
  if (pageIndex >= 0 && pageIndex < pageStats.length) {
    pageStats[pageIndex] = {
      ...pageStats[pageIndex],
      ...updates
    };

    await supabase
      .from('scout_runs')
      .update({ page_stats: pageStats })
      .eq('id', runId);
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
