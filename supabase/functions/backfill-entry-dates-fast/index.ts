import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hebrew months for date parsing
const HEBREW_MONTHS: Record<string, string> = {
  'ינואר': '01', 'פברואר': '02', 'מרץ': '03', 'אפריל': '04',
  'מאי': '05', 'יוני': '06', 'יולי': '07', 'אוגוסט': '08',
  'ספטמבר': '09', 'אוקטובר': '10', 'נובמבר': '11', 'דצמבר': '12'
};

// Fast regex-based extraction (no AI needed for most cases)
function extractEntryDateFast(markdown: string): { date: string | null; immediate: boolean; rawText?: string } {
  if (!markdown) return { date: null, immediate: false };
  
  const text = markdown.toLowerCase();
  
  // Check for immediate entry patterns
  const immediatePatterns = [
    /כניסה\s*מי[י]?דית/,
    /מי[י]?דית/,
    /כניסה\s*:?\s*מי[י]?ד/,
    /flexible/i,
    /גמיש/,
    /immediate/i,
    /כניסה\s*גמישה/
  ];
  
  for (const pattern of immediatePatterns) {
    if (pattern.test(markdown)) {
      return { date: null, immediate: true, rawText: 'מיידי/גמיש' };
    }
  }
  
  // Pattern 1: "כניסה: DD/MM/YYYY" or "תאריך כניסה DD.MM.YY"
  const datePatterns = [
    /כניסה[:\s]*(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/i,
    /תאריך\s*כניסה[:\s]*(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/i,
    /entry[:\s]*(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/i,
    /פנוי\s*מ[:\s]*(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/i,
    /זמין\s*מ[:\s]*(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/i
  ];
  
  for (const pattern of datePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const [_, day, month, year] = match;
      const fullYear = year.length === 2 ? `20${year}` : year;
      const isoDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      return { date: isoDate, immediate: false, rawText: match[0] };
    }
  }
  
  // Pattern 2: Hebrew month format "כניסה מרץ 2026" or "מרץ 2026"
  for (const [heb, monthNum] of Object.entries(HEBREW_MONTHS)) {
    const patterns = [
      new RegExp(`כניסה[:\\s]*${heb}[\\s]*(\\d{4})`, 'i'),
      new RegExp(`תאריך\\s*כניסה[:\\s]*${heb}[\\s]*(\\d{4})`, 'i'),
      new RegExp(`פנוי[:\\s]*${heb}[\\s]*(\\d{4})`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = markdown.match(pattern);
      if (match) {
        return { date: `${match[1]}-${monthNum}-01`, immediate: false, rawText: match[0] };
      }
    }
  }
  
  // Pattern 3: Just look for "כניסה" near any date
  const generalDateNearEntry = markdown.match(/כניסה[^0-9]{0,20}(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/i);
  if (generalDateNearEntry) {
    const [_, day, month, year] = generalDateNearEntry;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return { 
      date: `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`, 
      immediate: false, 
      rawText: generalDateNearEntry[0] 
    };
  }
  
  return { date: null, immediate: false };
}

// Fast scrape with timeout protection
async function fastScrape(url: string, apiKey: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout per scrape
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 8000,     // 8s instead of 10s
        waitFor: 1500,     // 1.5s instead of 2s
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.data?.markdown || data.markdown || null;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.log('Scrape timeout for:', url);
    } else {
      console.error('Scrape error:', error);
    }
    return null;
  }
}

// AI extraction as fallback (only when regex fails)
async function extractWithAI(markdown: string, apiKey: string): Promise<{ date: string | null; immediate: boolean }> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite', // Fastest model
        messages: [
          {
            role: 'system',
            content: `Extract entry date from Hebrew property listing. Look for "תאריך כניסה", "כניסה מיידית", dates near "כניסה". Return JSON only.`
          },
          {
            role: 'user',
            content: markdown.substring(0, 1500) // Smaller context for speed
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'set_entry_date',
            parameters: {
              type: 'object',
              properties: {
                entry_date: { type: 'string', description: 'YYYY-MM-DD or null' },
                immediate: { type: 'boolean' }
              },
              required: ['immediate']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'set_entry_date' } }
      })
    });

    if (!response.ok) {
      console.log('AI response not ok:', response.status);
      return { date: null, immediate: false };
    }

    // Safe JSON parsing - handle empty or invalid responses
    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      console.log('AI returned empty response');
      return { date: null, immediate: false };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('AI JSON parse error:', parseError, 'Response preview:', responseText.substring(0, 200));
      return { date: null, immediate: false };
    }

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return { date: args.entry_date || null, immediate: args.immediate || false };
    }
  } catch (error) {
    console.error('AI extraction error:', error);
  }
  
  return { date: null, immediate: false };
}

interface PropertyToProcess {
  id: string;
  source_url: string;
  source: string;
  features: Record<string, unknown> | null;
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
    const batchSize = body.batch_size || 10;  // Smaller batches to avoid timeout
    const useAiFallback = body.use_ai_fallback !== false; // Default: use AI fallback
    const cancelRequested = body.cancel === true;

    console.log(`Fast backfill: batch=${batchSize}, ai_fallback=${useAiFallback}, cancel=${cancelRequested}`);

    if (!FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY not configured');

    // Handle cancel
    if (cancelRequested) {
      await supabase
        .from('backfill_progress')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('task_name', 'backfill_entry_dates_fast')
        .eq('status', 'running');
      
      return new Response(JSON.stringify({ success: true, cancelled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get or create progress record
    const taskName = 'backfill_entry_dates_fast';
    let progressId: string;
    
    const { data: existingProgress } = await supabase
      .from('backfill_progress')
      .select('*')
      .eq('task_name', taskName)
      .eq('status', 'running')
      .single();

    if (existingProgress) {
      progressId = existingProgress.id;
      await supabase
        .from('backfill_progress')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', progressId);
    } else {
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
      console.log(`Created fast progress: ${progressId}, total: ${totalCount}`);
    }

    // Fetch properties
    const { data: properties, error: fetchError } = await supabase
      .from('scouted_properties')
      .select('id, source_url, source, features')
      .eq('is_active', true)
      .eq('property_type', 'rent')
      .not('source_url', 'is', null)
      .is('features->entry_date_source', null)
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (fetchError) throw fetchError;

    if (!properties || properties.length === 0) {
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

    console.log(`Processing ${properties.length} properties with fast method`);

    // Process in parallel - reduced concurrency to prevent timeout
    const PARALLEL_LIMIT = 5;
    let totalSuccessCount = 0;
    let totalFailCount = 0;
    let totalRegexCount = 0;
    let totalAiCount = 0;

    const { data: currentProgress } = await supabase
      .from('backfill_progress')
      .select('processed_items, successful_items, failed_items')
      .eq('id', progressId)
      .single();

    let runningProcessed = currentProgress?.processed_items || 0;
    let runningSuccess = currentProgress?.successful_items || 0;
    let runningFailed = currentProgress?.failed_items || 0;

    for (let i = 0; i < properties.length; i += PARALLEL_LIMIT) {
      // Reset batch counters for each batch
      let batchSuccessCount = 0;
      let batchFailCount = 0;
      let batchRegexCount = 0;
      let batchAiCount = 0;
      const batch = properties.slice(i, i + PARALLEL_LIMIT);
      
      const results = await Promise.allSettled(
        batch.map(async (property: PropertyToProcess) => {
          if (!property.source_url?.startsWith('http')) {
            return { id: property.id, success: false, error: 'Invalid URL' };
          }

          // Step 1: Fast scrape
          const markdown = await fastScrape(property.source_url, FIRECRAWL_API_KEY);
          if (!markdown) {
            return { id: property.id, success: false, error: 'Scrape failed' };
          }

          // Step 2: Try regex first (instant)
          const regexResult = extractEntryDateFast(markdown);
          if (regexResult.date || regexResult.immediate) {
            return { 
              id: property.id, 
              success: true, 
              entryDate: regexResult.date,
              immediate: regexResult.immediate,
              source: 'regex',
              rawText: regexResult.rawText
            };
          }

          // Step 3: AI fallback only if regex failed AND AI is enabled
          if (useAiFallback && LOVABLE_API_KEY) {
            const aiResult = await extractWithAI(markdown, LOVABLE_API_KEY);
            if (aiResult.date || aiResult.immediate) {
              return {
                id: property.id,
                success: true,
                entryDate: aiResult.date,
                immediate: aiResult.immediate,
                source: 'ai'
              };
            }
          }

          // No data found
          return { 
            id: property.id, 
            success: true, 
            entryDate: null, 
            immediate: false, 
            source: 'not_found' 
          };
        })
      );

      // Process results
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const property = batch[j];
        
        if (result.status === 'fulfilled' && result.value.success) {
          const { entryDate, immediate, source } = result.value;
          
          const updatedFeatures = {
            ...(property.features || {}),
            entry_date: entryDate,
            immediate_entry: immediate,
            entry_date_source: (entryDate || immediate) 
              ? `fast_backfill_${source}` 
              : 'fast_backfill_not_found'
          };

          await supabase
            .from('scouted_properties')
            .update({ features: updatedFeatures })
            .eq('id', property.id);

          batchSuccessCount++;
          if (source === 'regex') batchRegexCount++;
          if (source === 'ai') batchAiCount++;
          
          console.log(`✓ ${property.id}: date=${entryDate}, immediate=${immediate}, source=${source}`);
        } else {
          const updatedFeatures = {
            ...(property.features || {}),
            entry_date_source: 'fast_backfill_failed'
          };
          
          await supabase
            .from('scouted_properties')
            .update({ features: updatedFeatures })
            .eq('id', property.id);
          
          batchFailCount++;
          const error = result.status === 'rejected' ? result.reason : result.value.error;
          console.log(`✗ ${property.id}: ${error}`);
        }
      }

      // Update totals from this batch
      totalSuccessCount += batchSuccessCount;
      totalFailCount += batchFailCount;
      totalRegexCount += batchRegexCount;
      totalAiCount += batchAiCount;

      // Heartbeat update with correct incremental values
      runningProcessed += batch.length;
      runningSuccess += batchSuccessCount;
      runningFailed += batchFailCount;
      
      console.log(`Batch ${Math.floor(i / PARALLEL_LIMIT) + 1} done: +${batchSuccessCount} success, +${batchFailCount} fail, regex=${batchRegexCount}, ai=${batchAiCount}`);
      
      await supabase
        .from('backfill_progress')
        .update({
          processed_items: runningProcessed,
          successful_items: runningSuccess,
          failed_items: runningFailed,
          updated_at: new Date().toISOString()
        })
        .eq('id', progressId);

      // Minimal delay between batches
      if (i + PARALLEL_LIMIT < properties.length) {
        await new Promise(r => setTimeout(r, 200));
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
      successful: totalSuccessCount,
      failed: totalFailCount,
      regexHits: totalRegexCount,
      aiHits: totalAiCount,
      hasMore,
      remainingCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fast backfill error:', error);
    
    await supabase
      .from('backfill_progress')
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('task_name', 'backfill_entry_dates_fast')
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
