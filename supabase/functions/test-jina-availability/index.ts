import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { isListingRemoved, isMadlanHomepage } from "../_shared/availability-indicators.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GLOBAL_DEADLINE_MS = 50000;

function detectResult(content: string, source: string): string {
  if (!content || content.length < 100) return 'short_or_empty';
  if (isListingRemoved(content)) return 'listing_removed_indicator';
  if (source === 'madlan' && isMadlanHomepage(content)) return 'madlan_homepage_redirect';
  
  const lower = content.toLowerCase();
  if (lower.includes('captcha') || lower.includes('are you for real') || 
      lower.includes('additional verification') || lower.includes('bot manager') ||
      lower.includes('radware')) {
    return 'blocked_captcha';
  }
  
  return 'content_ok';
}

async function fetchWithJina(url: string, timeoutMs: number): Promise<{ status: number; content: string; elapsed: number }> {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'text/markdown',
        'X-Return-Format': 'markdown',
        'X-Locale': 'he-IL',
        'X-Timeout': '30',
        'X-No-Cache': 'true',
        'X-Wait-For-Selector': 'body',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const content = await response.text();
    return { status: response.status, content, elapsed: Date.now() - start };
  } catch (err) {
    clearTimeout(timeoutId);
    return { status: 0, content: err instanceof Error ? err.message : 'error', elapsed: Date.now() - start };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Parse params
  let testRunId: string | null = null;
  let totalTarget = 50;
  let isChain = false;
  try {
    const body = await req.json();
    testRunId = body.test_run_id || null;
    totalTarget = body.total_target || 50;
    isChain = body.is_chain === true;
  } catch { /* no body */ }

  // ===== ACTION: get_status - return current results =====
  if (testRunId && !isChain) {
    // Just return status of existing run
    const { data: run } = await supabase
      .from('backfill_progress')
      .select('*')
      .eq('id', testRunId)
      .single();

    if (!run) {
      return new Response(JSON.stringify({ error: 'Run not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      run_id: run.id,
      status: run.status,
      processed: run.processed_items,
      total: run.total_items,
      successful: run.successful_items,
      failed: run.failed_items,
      results: run.summary_data,
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // ===== START or CONTINUE a test run =====
  if (!testRunId) {
    // Create new run
    // First, clean up old test runs
    await supabase
      .from('backfill_progress')
      .delete()
      .eq('task_name', 'jina_test_run')
      .in('status', ['completed', 'stopped', 'failed']);

    // Fetch property IDs upfront - mixed sources
    const propertyIds: string[] = [];
    for (const source of ['yad2', 'madlan', 'homeless']) {
      const limit = Math.ceil(totalTarget / 3);
      const { data } = await supabase
        .from('scouted_properties')
        .select('id')
        .eq('is_active', true)
        .eq('source', source)
        .not('source_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (data) propertyIds.push(...data.map(p => p.id));
    }

    // Shuffle
    for (let i = propertyIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [propertyIds[i], propertyIds[j]] = [propertyIds[j], propertyIds[i]];
    }
    const finalIds = propertyIds.slice(0, totalTarget);

    const { data: newRun, error } = await supabase
      .from('backfill_progress')
      .insert({
        task_name: 'jina_test_run',
        status: 'running',
        started_at: new Date().toISOString(),
        total_items: finalIds.length,
        processed_items: 0,
        successful_items: 0,
        failed_items: 0,
        summary_data: { property_ids: finalIds, results: [], processed_index: 0 },
      })
      .select('id')
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    testRunId = newRun.id;
    console.log(`🧪 Created test run ${testRunId} with ${finalIds.length} properties`);

    // Self-chain to start processing
    fetch(`${supabaseUrl}/functions/v1/test-jina-availability`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_run_id: testRunId, is_chain: true }),
    }).catch(err => console.error('Chain start failed:', err));

    return new Response(JSON.stringify({
      run_id: testRunId,
      total_properties: finalIds.length,
      message: 'Test started! Use run_id to check status.',
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // ===== CHAIN: process batch =====
  const { data: run } = await supabase
    .from('backfill_progress')
    .select('*')
    .eq('id', testRunId)
    .single();

  if (!run || run.status !== 'running') {
    console.log('Run not found or not running, stopping');
    return new Response(JSON.stringify({ done: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const summaryData = run.summary_data as any;
  const propertyIds: string[] = summaryData.property_ids;
  const existingResults: any[] = summaryData.results || [];
  let processedIndex: number = summaryData.processed_index || 0;

  const runStart = Date.now();
  let batchProcessed = 0;
  let batchSuccess = 0;
  let batchFailed = 0;
  const batchResults: any[] = [];

  while (processedIndex < propertyIds.length) {
    // Check deadline
    const elapsed = Date.now() - runStart;
    if (elapsed > GLOBAL_DEADLINE_MS - 5000) {
      console.log(`⏱️ Deadline approaching after ${batchProcessed} properties`);
      break;
    }

    const propId = propertyIds[processedIndex];
    
    // Fetch property details
    const { data: prop } = await supabase
      .from('scouted_properties')
      .select('id, source_url, source, title, address')
      .eq('id', propId)
      .single();

    if (!prop || !prop.source_url) {
      processedIndex++;
      batchFailed++;
      continue;
    }

    const remainingTime = GLOBAL_DEADLINE_MS - (Date.now() - runStart) - 3000;
    if (remainingTime < 8000) break;

    console.log(`🔍 [${processedIndex + 1}/${propertyIds.length}] ${prop.source} - ${(prop.title || prop.address || '').substring(0, 50)}`);

    const { status, content, elapsed: fetchElapsed } = await fetchWithJina(prop.source_url, Math.min(35000, remainingTime));
    const detection = detectResult(content, prop.source);
    const success = detection === 'content_ok' || detection === 'listing_removed_indicator' || detection === 'madlan_homepage_redirect';

    console.log(`   → ${detection} | ${content.length} chars | ${fetchElapsed}ms | ${success ? '✅' : '❌'}`);

    batchResults.push({
      id: prop.id,
      source: prop.source,
      title: (prop.title || prop.address || '').substring(0, 60),
      jina_status: status,
      content_length: content.length,
      elapsed_ms: fetchElapsed,
      detection,
      success,
    });

    processedIndex++;
    batchProcessed++;
    if (success) batchSuccess++;
    else batchFailed++;

    // Delay between requests
    await new Promise(r => setTimeout(r, 1500));
  }

  // Update progress in DB
  const allResults = [...existingResults, ...batchResults];
  const totalProcessed = (run.processed_items || 0) + batchProcessed;
  const totalSuccess = (run.successful_items || 0) + batchSuccess;
  const totalFailed = (run.failed_items || 0) + batchFailed;
  const isDone = processedIndex >= propertyIds.length;

  await supabase
    .from('backfill_progress')
    .update({
      status: isDone ? 'completed' : 'running',
      processed_items: totalProcessed,
      successful_items: totalSuccess,
      failed_items: totalFailed,
      completed_at: isDone ? new Date().toISOString() : null,
      summary_data: {
        property_ids: propertyIds,
        results: allResults,
        processed_index: processedIndex,
        stats: {
          by_source: computeSourceStats(allResults),
          overall_success_rate: allResults.length > 0
            ? Math.round((allResults.filter((r: any) => r.success).length / allResults.length) * 100)
            : 0,
          avg_elapsed_ms: allResults.length > 0
            ? Math.round(allResults.reduce((sum: number, r: any) => sum + r.elapsed_ms, 0) / allResults.length)
            : 0,
        },
      },
    })
    .eq('id', testRunId);

  console.log(`📊 Batch done: ${batchProcessed} processed (${totalProcessed}/${propertyIds.length} total). Done: ${isDone}`);

  // Self-chain if not done
  if (!isDone) {
    console.log(`🔄 Self-chaining...`);
    await new Promise(r => setTimeout(r, 2000));
    fetch(`${supabaseUrl}/functions/v1/test-jina-availability`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_run_id: testRunId, is_chain: true }),
    }).catch(err => console.error('Self-chain failed:', err));
  }

  return new Response(JSON.stringify({
    run_id: testRunId,
    batch_processed: batchProcessed,
    total_processed: totalProcessed,
    total_target: propertyIds.length,
    done: isDone,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

function computeSourceStats(results: any[]): Record<string, any> {
  const stats: Record<string, any> = {};
  for (const r of results) {
    if (!stats[r.source]) {
      stats[r.source] = { total: 0, success: 0, blocked: 0, removed: 0, avg_ms: 0, errors: 0 };
    }
    const s = stats[r.source];
    s.total++;
    if (r.success) s.success++;
    if (r.detection === 'blocked_captcha') s.blocked++;
    if (r.detection === 'listing_removed_indicator' || r.detection === 'madlan_homepage_redirect') s.removed++;
    if (r.detection === 'fetch_error' || r.detection === 'short_or_empty') s.errors++;
    s.avg_ms += r.elapsed_ms;
  }
  for (const source of Object.keys(stats)) {
    stats[source].avg_ms = Math.round(stats[source].avg_ms / stats[source].total);
  }
  return stats;
}
