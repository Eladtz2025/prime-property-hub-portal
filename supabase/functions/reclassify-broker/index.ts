import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { detectBrokerFromMarkdown, extractEvidenceSnippet } from '../_shared/broker-detection.ts';
import { isPastEndTime, fetchCategorySettings } from '../_shared/settings.ts';
import { getActiveFirecrawlKey, markKeyExhausted, isRateLimitError } from '../_shared/firecrawl-keys.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Reclassify broker/private status for scouted properties.
 * 
 * Params:
 *   action: 'start' | 'continue' | 'stop' | 'status'
 *   source_filter: 'madlan' | 'yad2' | 'homeless' (required for start)
 *   max_items: number (optional, limits total items to process)
 *   is_private_filter: boolean | null (optional, filter by current state)
 *                      omit to process ALL properties regardless of state
 *   force_broker_reset: boolean (default false)
 *   batch_size: number (default 5)
 *   task_id: string (for continue/stop)
 *   dry_run: boolean (default false)
 *     When true: AUDIT MODE - no DB changes, computes confusion
 *     matrix and collects 30 examples per error type
 *     When false: FIX MODE - updates is_private when evidence found
 */

const TASK_NAME_BASE = 'reclassify_broker';
const DEFAULT_BATCH_SIZE = 5;

// ============================================
// Empty structures
// ============================================

function emptyConfusionMatrix() {
  return {
    correct_broker: 0,
    correct_private: 0,
    misclassified_as_broker: 0,
    misclassified_as_private: 0,
    unverifiable: 0,
  };
}

function emptyTransitions() {
  return {
    false_to_true: 0,
    false_to_null: 0,
    true_to_false: 0,
    null_to_false: 0,
    null_to_true: 0,
    unchanged: 0,
  };
}

function emptyExamplesByType() {
  return {
    false_to_true: [] as any[],
    false_to_null: [] as any[],
    true_to_false: [] as any[],
    null_to_false: [] as any[],
    null_to_true: [] as any[],
  };
}

// ============================================
// Main handler
// ============================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Firecrawl API key with rotation support
    let firecrawlKey = await getActiveFirecrawlKey(supabase);
    let firecrawlApiKey = firecrawlKey.key;

    const {
      action = 'start',
      task_id,
      source_filter,
      max_items,
      is_private_filter,
      force_broker_reset = false,
      batch_size,
      dry_run = false,
    } = await req.json().catch(() => ({}));

    // Effective dry_run — may be overridden by continue
    let effectiveDryRun = dry_run;

    // Task name: separate for audit so it doesn't block fix runs
    const getTaskName = (isDry: boolean) =>
      isDry ? `${TASK_NAME_BASE}_audit` : TASK_NAME_BASE;

    // === Stop ===
    if (action === 'stop' && task_id) {
      await supabase.from('backfill_progress').update({
        status: 'stopped',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', task_id);
      return new Response(JSON.stringify({ success: true, message: 'Stopped' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // === Status ===
    if (action === 'status') {
      const taskName = task_id ? undefined : getTaskName(effectiveDryRun);
      let statusQuery = supabase
        .from('backfill_progress')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (task_id) {
        statusQuery = statusQuery.eq('id', task_id);
      } else if (taskName) {
        statusQuery = statusQuery.eq('task_name', taskName);
      }

      const { data: progress } = await statusQuery.single();
      return new Response(JSON.stringify({ success: true, progress }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // === Validate ===
    if (action === 'start' && !source_filter) {
      return new Response(JSON.stringify({ success: false, error: 'source_filter is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // === Resolve task ===
    let progressId: string;
    let lastProcessedId: string | null = null;
    let effectiveMaxItems: number | null = max_items || null;
    let effectiveSourceFilter: string = source_filter;
    let effectiveIsPrivateFilter: boolean | null | undefined = is_private_filter;
    let effectiveForceBrokerReset: boolean = force_broker_reset;

    if (action === 'continue' && task_id) {
      progressId = task_id;
      const { data: taskData } = await supabase
        .from('backfill_progress')
        .select('last_processed_id, status, summary_data')
        .eq('id', task_id)
        .single();

      if (taskData?.status === 'stopped' || taskData?.status === 'completed') {
        return new Response(JSON.stringify({ success: true, message: taskData.status }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      lastProcessedId = taskData?.last_processed_id || null;
      // Restore params from summary_data
      const sd = (taskData?.summary_data as Record<string, any>) || {};
      effectiveMaxItems = sd._max_items ?? effectiveMaxItems;
      effectiveSourceFilter = sd._source_filter ?? effectiveSourceFilter;
      effectiveIsPrivateFilter = sd._is_private_filter;
      effectiveForceBrokerReset = sd._force_broker_reset ?? effectiveForceBrokerReset;
      effectiveDryRun = sd._dry_run ?? effectiveDryRun;
    } else {
      const taskName = getTaskName(effectiveDryRun);

      // Check for stuck tasks
      const { data: existingTask } = await supabase
        .from('backfill_progress')
        .select('*')
        .eq('task_name', taskName)
        .eq('status', 'running')
        .single();

      if (existingTask) {
        const taskAge = Date.now() - new Date(existingTask.updated_at).getTime();
        if (taskAge > 10 * 60 * 1000) {
          await supabase.from('backfill_progress').update({
            status: 'stopped',
            error_message: 'Auto-stopped (stuck 10+ min)',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).eq('id', existingTask.id);
        } else {
          return new Response(JSON.stringify({
            success: true, message: 'Already running', task_id: existingTask.id
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      // Count items
      let countQuery = supabase
        .from('scouted_properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('source_url', 'is', null)
        .eq('source', effectiveSourceFilter);

      if (effectiveIsPrivateFilter === false) {
        countQuery = countQuery.eq('is_private', false);
      } else if (effectiveIsPrivateFilter === true) {
        countQuery = countQuery.eq('is_private', true);
      } else if (effectiveIsPrivateFilter === null) {
        countQuery = countQuery.is('is_private', null);
      }

      const { count } = await countQuery;
      const totalItems = effectiveMaxItems ? Math.min(count || 0, effectiveMaxItems) : (count || 0);

      const { data: newTask, error: insertError } = await supabase
        .from('backfill_progress')
        .insert({
          task_name: taskName,
          status: 'running',
          total_items: totalItems,
          processed_items: 0,
          successful_items: 0,
          failed_items: 0,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          summary_data: {
            _source_filter: effectiveSourceFilter,
            _max_items: effectiveMaxItems,
            _is_private_filter: effectiveIsPrivateFilter,
            _force_broker_reset: effectiveForceBrokerReset,
            _dry_run: effectiveDryRun,
            _successful_total: 0,
            _failed_total: 0,
            transitions: emptyTransitions(),
            confusion_matrix: emptyConfusionMatrix(),
            examples_by_type: emptyExamplesByType(),
            examples: [],
          }
        })
        .select()
        .single();

      if (insertError) throw insertError;
      progressId = newTask.id;

      const modeLabel = effectiveDryRun ? 'AUDIT' : 'FIX';
      const filterDesc = effectiveIsPrivateFilter === false ? ' (is_private=false)' :
                          effectiveIsPrivateFilter === true ? ' (is_private=true)' :
                          effectiveIsPrivateFilter === null ? ' (is_private=null)' : ' (all states)';
      const maxDesc = effectiveMaxItems ? ` max=${effectiveMaxItems}` : '';
      console.log(`🚀 Reclassify [${modeLabel}] started: source=${effectiveSourceFilter}${filterDesc}${maxDesc}, total=${totalItems}`);
    }

    // === Fetch batch ===
    // Clamp batch_size to prevent timeouts (each item does a Firecrawl scrape ~3-5s)
    const effectiveBatchSize = Math.min(batch_size || DEFAULT_BATCH_SIZE, 10);

    const { data: progressData } = await supabase
      .from('backfill_progress')
      .select('processed_items, summary_data')
      .eq('id', progressId)
      .single();

    const alreadyProcessed = progressData?.processed_items || 0;
    if (effectiveMaxItems && alreadyProcessed >= effectiveMaxItems) {
      await supabase.from('backfill_progress').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', progressId);
      console.log(`✅ Reclassify completed: reached max_items=${effectiveMaxItems}`);
      return new Response(JSON.stringify({ success: true, status: 'completed', reason: 'max_items_reached' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const remainingMax = effectiveMaxItems ? effectiveMaxItems - alreadyProcessed : effectiveBatchSize;
    const thisBatchSize = Math.min(effectiveBatchSize, remainingMax);

    let query = supabase
      .from('scouted_properties')
      .select('id, source_url, source, is_private, address, city')
      .eq('is_active', true)
      .not('source_url', 'is', null)
      .eq('source', effectiveSourceFilter)
      .order('id', { ascending: true })
      .limit(thisBatchSize);

    if (effectiveIsPrivateFilter === false) {
      query = query.eq('is_private', false);
    } else if (effectiveIsPrivateFilter === true) {
      query = query.eq('is_private', true);
    } else if (effectiveIsPrivateFilter === null) {
      query = query.is('is_private', null);
    }

    if (lastProcessedId) {
      query = query.gt('id', lastProcessedId);
    }

    const { data: properties, error } = await query;
    if (error) throw error;

    if (!properties || properties.length === 0) {
      await supabase.from('backfill_progress').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', progressId);

      const sd = (progressData?.summary_data as Record<string, any>) || {};
      console.log(`✅ Reclassify completed: no more items`);
      console.log(`📊 FINAL confusion: ${JSON.stringify(sd.confusion_matrix)}`);
      console.log(`📊 FINAL transitions: ${JSON.stringify(sd.transitions)}`);

      return new Response(JSON.stringify({ success: true, status: 'completed', summary: sd }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 Reclassify batch: ${properties.length} properties (dry_run=${effectiveDryRun})`);

    // === Process batch ===
    let successCount = 0;
    let failCount = 0;
    let processedInBatch = 0;
    let lastId = lastProcessedId;

    const existingSummary = (progressData?.summary_data as Record<string, any>) || {};
    const transitions = { ...emptyTransitions(), ...(existingSummary.transitions || {}) };
    const confusion = { ...emptyConfusionMatrix(), ...(existingSummary.confusion_matrix || {}) };
    const examplesByType: Record<string, any[]> = {
      ...emptyExamplesByType(),
      ...(existingSummary.examples_by_type || {}),
    };
    // Deep-copy arrays so we don't mutate frozen objects
    for (const key of Object.keys(examplesByType)) {
      examplesByType[key] = [...(examplesByType[key] || [])];
    }
    const examples: Array<any> = [...(existingSummary.examples || [])];

    for (const prop of properties) {
      try {
        // Check stop
        const { data: taskStatus } = await supabase
          .from('backfill_progress')
          .select('status')
          .eq('id', progressId)
          .single();
        if (taskStatus?.status === 'stopped') {
          console.log('🛑 Stopped');
          break;
        }

        if (!prop.source_url || !prop.source_url.includes('http')) {
          failCount++;
          lastId = prop.id;
          continue;
        }

        console.log(`🔍 ${effectiveDryRun ? 'AUDIT' : 'FIX'}: ${prop.source_url} (current is_private=${prop.is_private})`);

        // Scrape
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: prop.source_url,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        if (!scrapeResponse.ok) {
          console.log(`❌ Scrape failed: ${scrapeResponse.status}`);
          failCount++;
          lastId = prop.id;
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';

        if (!markdown || markdown.length < 100) {
          console.log(`❌ No content`);
          failCount++;
          lastId = prop.id;
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }

        // Detect broker/private
        const oldValue = prop.is_private;
        const sourceUrl = prop.source_url || '';

        // === URL-based classification for Homeless (high reliability) ===
        let newValue: boolean | null = null;
        let auditReason: string | null = null;

        if (prop.source === 'homeless' && sourceUrl) {
          // Flexible regex: matches /SaleTivuch/ or /RentTivuch/ anywhere in path (case-insensitive)
          if (/(?:sale|rent)tivuch/i.test(sourceUrl)) {
            newValue = false; // Broker - URL is definitive
            auditReason = 'url_pattern_broker';
          } else if (/\/(sale|rent)\//i.test(sourceUrl)) {
            newValue = true; // Private - URL is definitive
            auditReason = 'url_pattern_private';
          }
        }

        // Fallback to markdown analysis if URL didn't resolve
        if (newValue === null) {
          newValue = detectBrokerFromMarkdown(markdown, prop.source);
          if (newValue !== null) {
            auditReason = newValue === true ? 'markdown_private_keyword' : 'markdown_broker_keyword';
          } else {
            auditReason = 'no_signals_found';
          }
        }

        const evidence = auditReason?.startsWith('url_pattern')
          ? `[${auditReason}] ${sourceUrl}`
          : extractEvidenceSnippet(markdown, prop.source);

        // --- Confusion matrix ---
        if (newValue !== null) {
          if (oldValue === false && newValue === false) confusion.correct_broker++;
          else if (oldValue === true && newValue === true) confusion.correct_private++;
          else if (oldValue === false && newValue === true) confusion.misclassified_as_broker++;
          else if (oldValue === true && newValue === false) confusion.misclassified_as_private++;
          // oldValue === null cases don't count as "correct" or "misclassified"
        } else {
          confusion.unverifiable++;
        }

        // --- Transition logic ---
        const oldKey = oldValue === true ? 'true' : oldValue === false ? 'false' : 'null';
        let actualNewValue = oldValue; // default: no change
        let transitionKey = 'unchanged';

        if (newValue !== null) {
          actualNewValue = newValue;
          const newKey = newValue === true ? 'true' : 'false';
          if (oldKey !== newKey) {
            transitionKey = `${oldKey}_to_${newKey}`;
          }
        } else if (effectiveForceBrokerReset && oldValue === false) {
          actualNewValue = null;
          transitionKey = 'false_to_null';
        }

        // Track transition
        if (transitions[transitionKey] !== undefined) {
          transitions[transitionKey]++;
        } else {
          transitions[transitionKey] = 1;
        }

        // Log
        const changeDesc = transitionKey === 'unchanged'
          ? `unchanged (${oldKey})`
          : `${oldKey} → ${actualNewValue === true ? 'true' : actualNewValue === false ? 'false' : 'null'}`;
        console.log(`  → ${changeDesc}${evidence ? ' | ' + evidence : ''}`);

        // --- Save example per transition type (up to 30 per type) ---
        if (transitionKey !== 'unchanged') {
          const exampleEntry = {
            id: prop.id,
            source_url: prop.source_url,
            address: prop.address,
            city: prop.city,
            old_is_private: oldValue,
            new_is_private: actualNewValue,
            evidence_snippet: evidence,
            audit_reason: auditReason,
          };

          if (!examplesByType[transitionKey]) {
            examplesByType[transitionKey] = [];
          }
          if (examplesByType[transitionKey].length < 30) {
            examplesByType[transitionKey].push(exampleEntry);
          }

          // Flat list for backward compat (max 30)
          if (examples.length < 30) {
            examples.push(exampleEntry);
          }
        }

        // Update DB only if changed AND not dry_run
        if (transitionKey !== 'unchanged' && !effectiveDryRun) {
          await supabase
            .from('scouted_properties')
            .update({ is_private: actualNewValue })
            .eq('id', prop.id);
        }

        successCount++;
        lastId = prop.id;
        processedInBatch++;

        // Save progress incrementally (per-item) so UI shows real progress even on timeout
        const incrementalSummary = {
          ...existingSummary,
          _source_filter: effectiveSourceFilter,
          _max_items: effectiveMaxItems,
          _is_private_filter: effectiveIsPrivateFilter,
          _force_broker_reset: effectiveForceBrokerReset,
          _dry_run: effectiveDryRun,
          _successful_total: (existingSummary._successful_total || 0) + successCount,
          _failed_total: (existingSummary._failed_total || 0) + failCount,
          transitions,
          confusion_matrix: confusion,
          examples_by_type: examplesByType,
          examples,
        };
        await supabase.from('backfill_progress').update({
          processed_items: alreadyProcessed + processedInBatch,
          successful_items: (existingSummary._successful_total || 0) + successCount,
          failed_items: (existingSummary._failed_total || 0) + failCount,
          last_processed_id: lastId,
          summary_data: incrementalSummary,
          updated_at: new Date().toISOString()
        }).eq('id', progressId);

        await new Promise(r => setTimeout(r, 1500));

      } catch (propError) {
        console.error(`Error processing ${prop.id}:`, propError);
        failCount++;
        lastId = prop.id;
        processedInBatch++;

        // Also save progress on failure so we don't lose the count
        const failSummary = {
          ...existingSummary,
          _source_filter: effectiveSourceFilter,
          _max_items: effectiveMaxItems,
          _is_private_filter: effectiveIsPrivateFilter,
          _force_broker_reset: effectiveForceBrokerReset,
          _dry_run: effectiveDryRun,
          _successful_total: (existingSummary._successful_total || 0) + successCount,
          _failed_total: (existingSummary._failed_total || 0) + failCount,
          transitions,
          confusion_matrix: confusion,
          examples_by_type: examplesByType,
          examples,
        };
        await supabase.from('backfill_progress').update({
          processed_items: alreadyProcessed + processedInBatch,
          successful_items: (existingSummary._successful_total || 0) + successCount,
          failed_items: (existingSummary._failed_total || 0) + failCount,
          last_processed_id: lastId,
          summary_data: failSummary,
          updated_at: new Date().toISOString()
        }).eq('id', progressId).catch(() => {});
      }
    }

    // === Update progress ===
    const updatedSummary = {
      ...existingSummary,
      _source_filter: effectiveSourceFilter,
      _max_items: effectiveMaxItems,
      _is_private_filter: effectiveIsPrivateFilter,
      _force_broker_reset: effectiveForceBrokerReset,
      _dry_run: effectiveDryRun,
      transitions,
      confusion_matrix: confusion,
      examples_by_type: examplesByType,
      examples,
    };

    // Final batch update (mostly redundant now since we save per-item, but ensures consistency)
    await supabase.from('backfill_progress').update({
      processed_items: alreadyProcessed + processedInBatch,
      successful_items: (existingSummary._successful_total || 0) + successCount,
      failed_items: (existingSummary._failed_total || 0) + failCount,
      last_processed_id: lastId,
      summary_data: updatedSummary,
      updated_at: new Date().toISOString()
    }).eq('id', progressId);

    console.log(`📊 Batch confusion: ${JSON.stringify(confusion)}`);
    console.log(`📊 Batch transitions: ${JSON.stringify(transitions)}`);

    // === Check if more to process ===
    const processedSoFar = alreadyProcessed + properties.length;
    const hitMaxItems = effectiveMaxItems && processedSoFar >= effectiveMaxItems;

    let remainingQuery = supabase
      .from('scouted_properties')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('source_url', 'is', null)
      .eq('source', effectiveSourceFilter)
      .gt('id', lastId || '');

    if (effectiveIsPrivateFilter === false) {
      remainingQuery = remainingQuery.eq('is_private', false);
    } else if (effectiveIsPrivateFilter === true) {
      remainingQuery = remainingQuery.eq('is_private', true);
    } else if (effectiveIsPrivateFilter === null) {
      remainingQuery = remainingQuery.is('is_private', null);
    }

    const { count: remainingCount } = await remainingQuery;
    const hasMore = !hitMaxItems && (remainingCount || 0) > 0;

    // Check schedule end time before self-chaining
    let endTimeReached = false;
    try {
      const backfillSettings = await fetchCategorySettings(supabase, 'backfill');
      endTimeReached = isPastEndTime(backfillSettings.schedule_end_time);
    } catch (e) {
      console.warn('Failed to check end time:', e);
    }

    if (hasMore && !endTimeReached) {
      console.log(`🔄 ${remainingCount} remaining, triggering next batch...`);
      try {
        await fetch(`${supabaseUrl}/functions/v1/reclassify-broker`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'continue',
            task_id: progressId,
            dry_run: effectiveDryRun,
          }),
        });
      } catch (triggerError) {
        console.error('Failed to trigger next batch:', triggerError);
      }
    } else if (endTimeReached && hasMore) {
      console.log(`⏰ End time reached, stopping. ${remainingCount} items remaining for next run.`);
      await supabase.from('backfill_progress').update({
        status: 'stopped',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error_message: `End time reached, ${remainingCount} items remaining`
      }).eq('id', progressId);
    } else {
      await supabase.from('backfill_progress').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', progressId);

      const reason = hitMaxItems ? 'max_items_reached' : 'all_processed';
      console.log(`✅ Reclassify completed: ${reason}. Total processed: ${processedSoFar}`);
      console.log(`📊 FINAL confusion: ${JSON.stringify(confusion)}`);
      console.log(`📊 FINAL transitions: ${JSON.stringify(transitions)}`);
      const exCounts = Object.entries(examplesByType).map(([k, v]) => `${k}=${(v as any[]).length}`).join(', ');
      console.log(`📊 Examples per type: ${exCounts}`);
    }

    return new Response(JSON.stringify({
      success: true,
      task_id: progressId,
      batch_processed: properties.length,
      batch_success: successCount,
      batch_failed: failCount,
      has_more: hasMore,
      remaining: remainingCount || 0,
      dry_run: effectiveDryRun,
      confusion_matrix: confusion,
      transitions,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Reclassify error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
