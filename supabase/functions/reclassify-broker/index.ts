import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

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
 *   max_items: number (optional, limits total items to process - for pilot runs)
 *   is_private_filter: boolean | null (optional, only process properties with this is_private value)
 *   force_broker_reset: boolean (default false, if true: null result + was false → set to null)
 *   batch_size: number (default 5)
 *   task_id: string (for continue/stop)
 *   dry_run: boolean (default false)
 */

const TASK_NAME = 'reclassify_broker';
const DEFAULT_BATCH_SIZE = 5;

// ============================================
// Broker Detection (copied from backfill - kept in sync)
// ============================================

function detectBrokerFromMarkdown(markdown: string, source: string): boolean | null {
  if (!markdown) return null;
  
  const textLower = markdown.toLowerCase();
  
  if (source === 'madlan') {
    const hasMativauch = /מתיווך/.test(markdown);
    const hasLicenseWithContext = /(?:רישיון|ר\.?ת\.?|תיווך)\s*:?\s*\d{7,8}/.test(markdown);
    const hasAgencyName = /שם הסוכנות/.test(markdown);
    
    if (hasMativauch || hasLicenseWithContext || hasAgencyName) {
      return false; // Broker
    }
    
    const isExplicitlyPrivate = /ללא\s*(ה)?תיווך|לא\s*למתווכים|ללא\s*מתווכים/i.test(markdown);
    if (isExplicitlyPrivate) {
      return true; // Private
    }
    
    return null;
  }
  
  if (source === 'yad2') {
    if (/מפרטי/.test(markdown)) return true;
    if (/ללא\s*תיווך/.test(markdown)) return true;
    if (/לא\s*למתווכים/.test(markdown)) return true;
    if (/בעל\s*הדירה/.test(markdown)) return true;
    
    if (/מתיווך/.test(markdown)) return false;
    if (/משרד\s*תיווך/.test(markdown)) return false;
    if (/מתווכ/.test(markdown)) return false;
    
    const hasTivuchWithLicense = /תיווך:?\s*\d{7}/.test(markdown);
    const hasExplicitLicense = /(?:רישיון|ר\.?ת\.?)\s*:?\s*\d{7}/.test(markdown);
    const hasExclusivity = /בבלעדיות/.test(markdown);
    const BROKER_BRANDS = ['רימקס', 're/max', 'remax', 'אנגלו סכסון', 'century 21', 'קולדוול'];
    const hasBrokerBrand = BROKER_BRANDS.some(brand => textLower.includes(brand.toLowerCase()));
    
    if (hasTivuchWithLicense || hasExplicitLicense || hasExclusivity || hasBrokerBrand) {
      return false;
    }
    
    return null;
  }
  
  if (source === 'homeless') {
    if (/שם הסוכנות/.test(markdown) || /שם הסוכן/.test(markdown)) return false;
    return null;
  }
  
  const BROKER_BRANDS = ['רימקס', 're/max', 'remax', 'אנגלו סכסון', 'century 21', 'קולדוול'];
  if (BROKER_BRANDS.some(brand => textLower.includes(brand.toLowerCase()))) return false;
  
  return null;
}

/**
 * Extract the evidence snippet that triggered the classification
 */
function extractEvidenceSnippet(markdown: string, source: string): string | null {
  if (!markdown) return null;
  
  const patterns: Array<{ regex: RegExp; label: string }> = [
    { regex: /מתיווך/, label: 'מתיווך' },
    { regex: /(?:רישיון|ר\.?ת\.?|תיווך)\s*:?\s*\d{7,8}/, label: 'license' },
    { regex: /שם הסוכנות/, label: 'שם הסוכנות' },
    { regex: /ללא\s*(ה)?תיווך/, label: 'ללא תיווך' },
    { regex: /לא\s*למתווכים/, label: 'לא למתווכים' },
    { regex: /ללא\s*מתווכים/, label: 'ללא מתווכים' },
    { regex: /מפרטי/, label: 'מפרטי' },
    { regex: /בעל\s*הדירה/, label: 'בעל הדירה' },
    { regex: /משרד\s*תיווך/, label: 'משרד תיווך' },
    { regex: /מתווכ/, label: 'מתווכ*' },
    { regex: /בבלעדיות/, label: 'בבלעדיות' },
    { regex: /רימקס|re\/max|remax/i, label: 'brand:remax' },
    { regex: /אנגלו\s*סכסון/i, label: 'brand:anglo-saxon' },
    { regex: /century\s*21/i, label: 'brand:century21' },
    { regex: /קולדוול/i, label: 'brand:coldwell' },
    { regex: /שם הסוכן/, label: 'שם הסוכן' },
  ];
  
  for (const { regex, label } of patterns) {
    const match = markdown.match(regex);
    if (match) {
      // Get surrounding context (30 chars before and after)
      const idx = match.index || 0;
      const start = Math.max(0, idx - 30);
      const end = Math.min(markdown.length, idx + match[0].length + 30);
      const context = markdown.substring(start, end).replace(/\n/g, ' ').trim();
      return `[${label}] ...${context}...`;
    }
  }
  
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      action = 'start',
      task_id,
      source_filter,
      max_items,
      is_private_filter,     // null | true | false — filter input properties
      force_broker_reset = false,
      batch_size,
      dry_run = false,
    } = await req.json().catch(() => ({}));

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
      const { data: progress } = await supabase
        .from('backfill_progress')
        .select('*')
        .eq('task_name', TASK_NAME)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
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
    } else {
      // Check for stuck tasks
      const { data: existingTask } = await supabase
        .from('backfill_progress')
        .select('*')
        .eq('task_name', TASK_NAME)
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
          task_name: TASK_NAME,
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
            transitions: {
              false_to_true: 0,
              false_to_null: 0,
              true_to_false: 0,
              null_to_false: 0,
              null_to_true: 0,
              unchanged: 0,
            },
            examples: [],
          }
        })
        .select()
        .single();

      if (insertError) throw insertError;
      progressId = newTask.id;

      const filterDesc = effectiveIsPrivateFilter === false ? ' (is_private=false only)' :
                          effectiveIsPrivateFilter === true ? ' (is_private=true only)' :
                          effectiveIsPrivateFilter === null ? ' (is_private=null only)' : '';
      const maxDesc = effectiveMaxItems ? ` max=${effectiveMaxItems}` : '';
      console.log(`🚀 Reclassify started: source=${effectiveSourceFilter}${filterDesc}${maxDesc}, total=${totalItems}`);
    }

    // === Fetch batch ===
    const effectiveBatchSize = batch_size || DEFAULT_BATCH_SIZE;

    // Check how many we've already processed (for max_items enforcement)
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
      console.log(`✅ Reclassify completed: no more items`);

      // Final stats log
      const sd = (progressData?.summary_data as Record<string, any>) || {};
      console.log(`📊 FINAL transitions:`, JSON.stringify(sd.transitions));

      return new Response(JSON.stringify({ success: true, status: 'completed', summary: sd }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 Reclassify batch: ${properties.length} properties`);

    // === Process batch ===
    let successCount = 0;
    let failCount = 0;
    let lastId = lastProcessedId;

    // Load existing summary for merging
    const existingSummary = (progressData?.summary_data as Record<string, any>) || {};
    const transitions = { ...(existingSummary.transitions || {
      false_to_true: 0, false_to_null: 0, true_to_false: 0,
      null_to_false: 0, null_to_true: 0, unchanged: 0,
    })};
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

        console.log(`🔍 Reclassify: ${prop.source_url} (current is_private=${prop.is_private})`);

        // Scrape individual property page
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
        const newValue = detectBrokerFromMarkdown(markdown, prop.source);
        const evidence = extractEvidenceSnippet(markdown, prop.source);

        // Determine transition
        const oldKey = oldValue === true ? 'true' : oldValue === false ? 'false' : 'null';
        let actualNewValue = oldValue; // default: no change
        let transitionKey = 'unchanged';

        if (newValue !== null) {
          // Got a definitive answer → override
          actualNewValue = newValue;
          const newKey = newValue === true ? 'true' : 'false';
          if (oldKey !== newKey) {
            transitionKey = `${oldKey}_to_${newKey}`;
          } else {
            transitionKey = 'unchanged';
          }
        } else if (effectiveForceBrokerReset && oldValue === false) {
          // force_broker_reset: null result + was false → set to null
          actualNewValue = null;
          transitionKey = 'false_to_null';
        }
        // else: null result, no force_reset → unchanged

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

        // Save example (up to 30 max for reporting)
        if (transitionKey !== 'unchanged' && examples.length < 30) {
          examples.push({
            id: prop.id,
            source_url: prop.source_url,
            address: prop.address,
            old_is_private: oldValue,
            new_is_private: actualNewValue,
            evidence_snippet: evidence,
          });
        }

        // Update DB if changed
        if (transitionKey !== 'unchanged' && !dry_run) {
          await supabase
            .from('scouted_properties')
            .update({ is_private: actualNewValue })
            .eq('id', prop.id);
        }

        successCount++;
        lastId = prop.id;

        // Save progress incrementally
        await supabase.from('backfill_progress').update({
          last_processed_id: lastId,
          updated_at: new Date().toISOString()
        }).eq('id', progressId);

        await new Promise(r => setTimeout(r, 1500));

      } catch (propError) {
        console.error(`Error processing ${prop.id}:`, propError);
        failCount++;
        lastId = prop.id;
      }
    }

    // === Update progress ===
    const updatedSummary = {
      ...existingSummary,
      _source_filter: effectiveSourceFilter,
      _max_items: effectiveMaxItems,
      _is_private_filter: effectiveIsPrivateFilter,
      _force_broker_reset: effectiveForceBrokerReset,
      transitions,
      examples,
    };

    await supabase.from('backfill_progress').update({
      processed_items: alreadyProcessed + properties.length,
      successful_items: (progressData?.summary_data as any)?.successful_items_total || 0 + successCount,
      failed_items: (progressData?.summary_data as any)?.failed_items_total || 0 + failCount,
      last_processed_id: lastId,
      summary_data: updatedSummary,
      updated_at: new Date().toISOString()
    }).eq('id', progressId);

    console.log(`📊 Batch transitions: ${JSON.stringify(transitions)}`);

    // === Check if more to process ===
    const processedSoFar = alreadyProcessed + properties.length;
    const hitMaxItems = effectiveMaxItems && processedSoFar >= effectiveMaxItems;

    // Quick remaining check
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

    if (hasMore) {
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
            dry_run,
          }),
        });
      } catch (triggerError) {
        console.error('Failed to trigger next batch:', triggerError);
      }
    } else {
      await supabase.from('backfill_progress').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', progressId);

      const reason = hitMaxItems ? 'max_items_reached' : 'all_processed';
      console.log(`✅ Reclassify completed: ${reason}. Total processed: ${processedSoFar}`);
      console.log(`📊 FINAL transitions: ${JSON.stringify(transitions)}`);
      console.log(`📊 Examples (${examples.length}): ${JSON.stringify(examples.slice(0, 5))}`);
    }

    return new Response(JSON.stringify({
      success: true,
      task_id: progressId,
      batch_processed: properties.length,
      batch_success: successCount,
      batch_failed: failCount,
      has_more: hasMore,
      remaining: remainingCount || 0,
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
