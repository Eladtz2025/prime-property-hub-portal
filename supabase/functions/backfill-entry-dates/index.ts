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
    const batchSize = body.batch_size || 10;
    const continueFrom = body.continue_from || null;

    console.log(`Starting backfill-entry-dates. Batch size: ${batchSize}, Continue from: ${continueFrom}`);

    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Create or get progress record
    let progressId: string;
    const taskName = 'backfill_entry_dates';
    
    const { data: existingProgress } = await supabase
      .from('backfill_progress')
      .select('*')
      .eq('task_name', taskName)
      .eq('status', 'running')
      .single();

    if (existingProgress) {
      progressId = existingProgress.id;
      console.log(`Resuming existing progress: ${progressId}`);
    } else {
      // Count total properties to process
      const { count: totalCount } = await supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('property_type', 'rental')
        .or('features->entry_date.is.null,features->immediate_entry.is.null');

      const { data: newProgress, error: progressError } = await supabase
        .from('backfill_progress')
        .insert({
          task_name: taskName,
          status: 'running',
          total_items: totalCount || 0,
          processed_items: 0,
          successful_items: 0,
          failed_items: 0,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (progressError) throw progressError;
      progressId = newProgress.id;
      console.log(`Created new progress record: ${progressId}, total items: ${totalCount}`);
    }

    // Get properties to process - rental properties without entry_date
    let query = supabase
      .from('scouted_properties')
      .select('id, source_url, source, features, title, address')
      .eq('is_active', true)
      .eq('property_type', 'rental')
      .or('features->entry_date.is.null,features->immediate_entry.is.null')
      .not('source_url', 'is', null)
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (continueFrom) {
      query = query.gt('id', continueFrom);
    }

    const { data: properties, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    if (!properties || properties.length === 0) {
      // Mark as completed
      await supabase
        .from('backfill_progress')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', progressId);

      return new Response(JSON.stringify({
        success: true,
        message: 'No more properties to process',
        completed: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing ${properties.length} properties`);

    let successCount = 0;
    let failCount = 0;
    let lastProcessedId = '';

    for (const property of properties) {
      try {
        console.log(`Processing property ${property.id}: ${property.source_url}`);
        
        // Skip if URL is invalid
        if (!property.source_url || !property.source_url.startsWith('http')) {
          console.log(`Skipping invalid URL: ${property.source_url}`);
          failCount++;
          continue;
        }

        // Scrape with Firecrawl
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: property.source_url,
            formats: ['markdown'],
            onlyMainContent: true,
            timeout: 30000
          })
        });

        if (!scrapeResponse.ok) {
          console.error(`Firecrawl error for ${property.id}: ${scrapeResponse.status}`);
          failCount++;
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const markdown = scrapeData.data?.markdown || '';

        if (!markdown || markdown.length < 100) {
          console.log(`No content for ${property.id}, skipping`);
          failCount++;
          continue;
        }

        // Extract entry date using AI
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a real estate data extraction expert. Extract the entry/availability date from the Hebrew property listing.

Look for these patterns:
- "תאריך כניסה" (entry date) followed by a date
- "כניסה מידית" or "מיידי" (immediate entry)
- Dates like "01/03/2026", "1.3.26", "מרץ 2026"
- "זמין מ-" or "פנוי מ-" followed by a date

Return ONLY a JSON object with no additional text.`
              },
              {
                role: 'user',
                content: `Extract the entry/availability date from this property listing:\n\n${markdown.substring(0, 3000)}`
              }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'set_entry_date',
                description: 'Set the entry date for a property',
                parameters: {
                  type: 'object',
                  properties: {
                    entry_date: { 
                      type: 'string', 
                      description: 'Entry date in format YYYY-MM-DD, or null if not found' 
                    },
                    immediate: { 
                      type: 'boolean',
                      description: 'True if immediate entry (כניסה מידית/מיידי)' 
                    },
                    raw_date_text: {
                      type: 'string',
                      description: 'The original date text found in the listing'
                    }
                  },
                  required: ['immediate']
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'set_entry_date' } }
          })
        });

        if (!aiResponse.ok) {
          console.error(`AI error for ${property.id}: ${aiResponse.status}`);
          failCount++;
          continue;
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

            // Try to parse if AI gave us a different format
            if (entryDate && !entryDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              entryDate = parseHebrewDate(entryDate) || entryDate;
            }
          }
        } catch (parseErr) {
          console.error(`Error parsing AI response for ${property.id}:`, parseErr);
        }

        // Only update if we found something
        if (entryDate || immediateEntry) {
          const updatedFeatures = {
            ...(property.features || {}),
            entry_date: entryDate,
            immediate_entry: immediateEntry,
            entry_date_source: 'backfill',
            entry_date_raw: rawDateText
          };

          const { error: updateError } = await supabase
            .from('scouted_properties')
            .update({ features: updatedFeatures })
            .eq('id', property.id);

          if (updateError) {
            console.error(`Update error for ${property.id}:`, updateError);
            failCount++;
          } else {
            console.log(`Updated ${property.id}: entry_date=${entryDate}, immediate=${immediateEntry}`);
            successCount++;
          }
        } else {
          console.log(`No entry date found for ${property.id}`);
          // Mark as processed even if no date found
          const updatedFeatures = {
            ...(property.features || {}),
            entry_date: null,
            immediate_entry: false,
            entry_date_source: 'backfill_not_found'
          };

          await supabase
            .from('scouted_properties')
            .update({ features: updatedFeatures })
            .eq('id', property.id);
          
          successCount++;
        }

        lastProcessedId = property.id;

        // Delay between requests
        await new Promise(r => setTimeout(r, 2000));

      } catch (propError) {
        console.error(`Error processing property ${property.id}:`, propError);
        failCount++;
        lastProcessedId = property.id;
      }
    }

    // Update progress
    const { data: currentProgress } = await supabase
      .from('backfill_progress')
      .select('processed_items, successful_items, failed_items')
      .eq('id', progressId)
      .single();

    await supabase
      .from('backfill_progress')
      .update({
        processed_items: (currentProgress?.processed_items || 0) + properties.length,
        successful_items: (currentProgress?.successful_items || 0) + successCount,
        failed_items: (currentProgress?.failed_items || 0) + failCount,
        last_processed_id: lastProcessedId,
        updated_at: new Date().toISOString()
      })
      .eq('id', progressId);

    // Check if there are more to process
    const { count: remainingCount } = await supabase
      .from('scouted_properties')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('property_type', 'rental')
      .or('features->entry_date.is.null,features->immediate_entry.is.null')
      .not('source_url', 'is', null)
      .gt('id', lastProcessedId);

    const hasMore = (remainingCount || 0) > 0;

    return new Response(JSON.stringify({
      success: true,
      processed: properties.length,
      successful: successCount,
      failed: failCount,
      lastProcessedId,
      hasMore,
      remainingCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Backfill error:', error);
    
    // Update progress as failed
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
