import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse Hebrew date formats to ISO YYYY-MM-DD
function parseHebrewDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  const hebrewMonths: Record<string, number> = {
    'ינואר': 1, 'פברואר': 2, 'מרץ': 3, 'אפריל': 4,
    'מאי': 5, 'יוני': 6, 'יולי': 7, 'אוגוסט': 8,
    'ספטמבר': 9, 'אוקטובר': 10, 'נובמבר': 11, 'דצמבר': 12
  };
  
  // Try DD/MM/YYYY or DD.MM.YYYY format
  const slashMatch = dateStr.match(/(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{2,4})/);
  if (slashMatch) {
    const [_, day, month, year] = slashMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try Hebrew month format "מרץ 2026" or "2026 מרץ"
  for (const [heb, num] of Object.entries(hebrewMonths)) {
    if (dateStr.includes(heb)) {
      const yearMatch = dateStr.match(/\d{4}/);
      if (yearMatch) {
        return `${yearMatch[0]}-${String(num).padStart(2, '0')}-01`;
      }
    }
  }
  
  return null;
}

interface PropertyToProcess {
  id: string;
  source_url: string;
  source: string;
  features: Record<string, unknown> | null;
  title: string | null;
  address: string | null;
  created_at: string;
}

interface ProcessResult {
  id: string;
  success: boolean;
  entryDate?: string | null;
  immediateEntry?: boolean;
  error?: string;
}

// Process a single property with retry logic
async function processProperty(
  property: PropertyToProcess,
  firecrawlKey: string,
  lovableKey: string,
  maxRetries: number = 2
): Promise<ProcessResult> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Skip invalid URLs
      if (!property.source_url || !property.source_url.startsWith('http')) {
        return { id: property.id, success: false, error: 'Invalid URL' };
      }

      // Scrape with Firecrawl
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: property.source_url,
          formats: ['markdown'],
          onlyMainContent: true,
          timeout: 20000
        })
      });

      if (!scrapeResponse.ok) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        return { id: property.id, success: false, error: `Firecrawl ${scrapeResponse.status}` };
      }

      const scrapeData = await scrapeResponse.json();
      const markdown = scrapeData.data?.markdown || '';

      if (!markdown || markdown.length < 100) {
        return { id: property.id, success: false, error: 'No content' };
      }

      // Extract entry date using AI
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You extract entry/availability dates from Hebrew property listings.

Look for:
- "תאריך כניסה" followed by a date or "מיידי"/"גמיש"
- "כניסה מידית" or "כניסה מיידית"
- "כניסה:" followed by date info
- Dates like "01/03/2026", "1.3.26", "מרץ 2026"
- "זמין מ-" or "פנוי מ-"

Return JSON only, no extra text.`
            },
            {
              role: 'user',
              content: `Extract entry date:\n\n${markdown.substring(0, 2500)}`
            }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'set_entry_date',
              description: 'Set entry date for property',
              parameters: {
                type: 'object',
                properties: {
                  entry_date: { type: 'string', description: 'YYYY-MM-DD or null' },
                  immediate: { type: 'boolean', description: 'True if immediate entry' },
                  raw_date_text: { type: 'string', description: 'Original text found' }
                },
                required: ['immediate']
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'set_entry_date' } }
        })
      });

      if (!aiResponse.ok) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        return { id: property.id, success: false, error: `AI ${aiResponse.status}` };
      }

      const aiData = await aiResponse.json();
      let entryDate: string | null = null;
      let immediateEntry = false;
      let rawDateText: string | null = null;

      try {
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const args = JSON.parse(toolCall.function.arguments);
          entryDate = args.entry_date || null;
          immediateEntry = args.immediate || false;
          rawDateText = args.raw_date_text || null;

          // Parse if non-standard format
          if (entryDate && !entryDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            entryDate = parseHebrewDate(entryDate) || entryDate;
          }
        }
      } catch {
        // Parse error - treat as no data found
      }

      return {
        id: property.id,
        success: true,
        entryDate,
        immediateEntry
      };

    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      return { id: property.id, success: false, error: error.message };
    }
  }
  
  return { id: property.id, success: false, error: 'Max retries exceeded' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 15; // Reduced from 30 to prevent timeout
    const cancelRequested = body.cancel === true;

    console.log(`Backfill-entry-dates: batch=${batchSize}, cancel=${cancelRequested}`);

    if (!FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY not configured');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Handle cancel request
    if (cancelRequested) {
      await supabase
        .from('backfill_progress')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('task_name', 'backfill_entry_dates')
        .eq('status', 'running');
      
      return new Response(JSON.stringify({ success: true, cancelled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get or create progress record
    const taskName = 'backfill_entry_dates';
    let progressId: string;
    
    const { data: existingProgress } = await supabase
      .from('backfill_progress')
      .select('*')
      .eq('task_name', taskName)
      .eq('status', 'running')
      .single();

    if (existingProgress) {
      // MUTEX CHECK: If recently updated, skip to prevent duplicate processing
      const lastUpdate = new Date(existingProgress.updated_at || existingProgress.started_at);
      const secondsSinceUpdate = (Date.now() - lastUpdate.getTime()) / 1000;
      
      if (secondsSinceUpdate < 15) {
        console.log(`Skipping - another instance is processing (last update ${secondsSinceUpdate.toFixed(1)}s ago)`);
        return new Response(JSON.stringify({
          success: true,
          skipped: true,
          message: 'Processing in progress by another instance',
          processed_items: existingProgress.processed_items,
          total_items: existingProgress.total_items
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      progressId = existingProgress.id;
      console.log(`Resuming progress: ${progressId} (last update ${secondsSinceUpdate.toFixed(1)}s ago)`);
      
      // Mark as currently processing immediately
      await supabase
        .from('backfill_progress')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', progressId);
    } else {
      // Count properties that need processing
      // CRITICAL: Only select properties where entry_date_source IS NULL
      const { count: totalCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('property_type', 'rent')
        .not('source_url', 'is', null)
        .is('features->entry_date_source', null);

      const { data: newProgress, error: progressError } = await supabase
        .from('backfill_progress')
        .insert({
          task_name: taskName,
          status: 'running',
          total_items: totalCount || 0,
          processed_items: 0,
          successful_items: 0,
          failed_items: 0,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (progressError) throw progressError;
      progressId = newProgress.id;
      console.log(`Created progress: ${progressId}, total: ${totalCount}`);
    }

    // Fetch properties to process
    // CRITICAL: Filter by entry_date_source IS NULL to avoid reprocessing
    // No need for continueFrom - the filter handles it automatically
    const { data: properties, error: fetchError } = await supabase
      .from('scouted_properties')
      .select('id, source_url, source, features, title, address, created_at')
      .eq('is_active', true)
      .eq('property_type', 'rent')
      .not('source_url', 'is', null)
      .is('features->entry_date_source', null)
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (fetchError) throw fetchError;

    if (!properties || properties.length === 0) {
      // Mark as completed
      await supabase
        .from('backfill_progress')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', progressId);

      return new Response(JSON.stringify({
        success: true,
        message: 'No more properties to process',
        completed: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing ${properties.length} properties in parallel batches`);

    // Process in parallel batches of 5
    const PARALLEL_LIMIT = 5;
    let successCount = 0;
    let failCount = 0;
    let lastCreatedAt = '';

    // Get current progress for incremental updates
    const { data: currentProgress } = await supabase
      .from('backfill_progress')
      .select('processed_items, successful_items, failed_items')
      .eq('id', progressId)
      .single();

    let runningProcessed = currentProgress?.processed_items || 0;
    let runningSuccess = currentProgress?.successful_items || 0;
    let runningFailed = currentProgress?.failed_items || 0;

    for (let i = 0; i < properties.length; i += PARALLEL_LIMIT) {
      const batch = properties.slice(i, i + PARALLEL_LIMIT);
      
      const results = await Promise.allSettled(
        batch.map(prop => processProperty(prop, FIRECRAWL_API_KEY, LOVABLE_API_KEY))
      );

      let batchSuccess = 0;
      let batchFail = 0;

      // Process results
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const property = batch[j];
        
        if (result.status === 'fulfilled' && result.value.success) {
          const { entryDate, immediateEntry } = result.value;
          
          // Update the property with extracted data
          const updatedFeatures = {
            ...(property.features || {}),
            entry_date: entryDate,
            immediate_entry: immediateEntry,
            entry_date_source: (entryDate || immediateEntry) ? 'backfill' : 'backfill_not_found'
          };

          await supabase
            .from('scouted_properties')
            .update({ features: updatedFeatures })
            .eq('id', property.id);

          successCount++;
          batchSuccess++;
          console.log(`✓ ${property.id}: date=${entryDate}, immediate=${immediateEntry}`);
        } else {
          // Mark as processed even if failed (to avoid retrying forever)
          const updatedFeatures = {
            ...(property.features || {}),
            entry_date_source: 'backfill_failed'
          };
          
          await supabase
            .from('scouted_properties')
            .update({ features: updatedFeatures })
            .eq('id', property.id);
          
          failCount++;
          batchFail++;
          const error = result.status === 'rejected' ? result.reason : result.value.error;
          console.log(`✗ ${property.id}: ${error}`);
        }
        
        lastCreatedAt = property.created_at;
      }

      // HEARTBEAT: Update progress after each sub-batch to maintain mutex lock
      runningProcessed += batch.length;
      runningSuccess += batchSuccess;
      runningFailed += batchFail;
      
      await supabase
        .from('backfill_progress')
        .update({
          processed_items: runningProcessed,
          successful_items: runningSuccess,
          failed_items: runningFailed,
          last_processed_id: lastCreatedAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', progressId);
      
      console.log(`Heartbeat: ${runningProcessed} processed, ${runningSuccess} success, ${runningFailed} failed`);

      // Small delay between parallel batches
      if (i + PARALLEL_LIMIT < properties.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Check remaining
    const { count: remainingCount } = await supabase
      .from('scouted_properties')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('property_type', 'rent')
      .not('source_url', 'is', null)
      .is('features->entry_date_source', null);

    const hasMore = (remainingCount || 0) > 0;

    return new Response(JSON.stringify({
      success: true,
      processed: properties.length,
      successful: successCount,
      failed: failCount,
      hasMore,
      remainingCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Backfill error:', error);
    
    await supabase
      .from('backfill_progress')
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('task_name', 'backfill_entry_dates')
      .eq('status', 'running');

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
