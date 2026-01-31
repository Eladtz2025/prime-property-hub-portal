import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Broker detection keywords (shared across all sources)
const brokerKeywords = [
  'תיווך', 'סוכנות', 'משרד', 'נדל"ן', 'נדלן',
  'REAL ESTATE', 'Premium', 'ניהול נכסים', 'נכסים', 
  'Properties', 'HomeMe', 'הומלנד', 'בית ממכר',
  'רימקס', 'אנגלו סכסון', 're/max', 'remax', 'century 21',
  'קולדוול בנקר', 'coldwell', 'מתווך', 'מתווכת', 'agency',
  'ריאלטי', 'realty', 'קבוצת', 'group', 'אחוזות', 'broker',
  'בבלעדיות'
];

function classifyYad2(rawText: string, description: string): boolean {
  if (!rawText && !description) return false; // Unknown = assume broker
  
  const text = `${rawText || ''} ${description || ''}`;
  
  // Remove RTL markers
  const cleaned = text
    .replace(/[\u200F\u200E‎‏]/g, '')
    .replace(/\\{2,}/g, '\\');
  
  // Check for broker keywords
  const textLower = cleaned.toLowerCase();
  const hasBrokerKeywords = brokerKeywords.some(k => 
    textLower.includes(k.toLowerCase())
  );
  
  if (hasBrokerKeywords) return false; // Broker
  
  // SIMPLE RULE: Private = price comes right after backslash
  const isPrivatePattern = /\\\s*₪/.test(cleaned);
  
  // Check for repeated agency name (definite broker)
  const agencyRepeatedPattern = /([A-Za-z\u0590-\u05FF][A-Za-z\u0590-\u05FF\s.'"-]+?)\s*\\+\s*\1\s*₪/;
  const hasAgencyRepeated = agencyRepeatedPattern.test(cleaned);
  
  if (hasAgencyRepeated) return false; // Broker
  
  // Private if: price comes right after backslash AND no broker keywords
  return isPrivatePattern;
}

function classifyMadlan(rawText: string, description: string): boolean {
  if (!rawText && !description) return false; // Unknown = assume broker
  
  const text = `${rawText || ''} ${description || ''}`;
  const textLower = text.toLowerCase();
  
  // Check for "תיווך" label at end of block (Madlan specific)
  if (/תיווך\s*$/m.test(text) || /תיווך\s*\]/m.test(text)) {
    return false; // Broker
  }
  
  // Check broker keywords
  const hasBrokerKeywords = brokerKeywords.some(k => 
    textLower.includes(k.toLowerCase())
  );
  
  if (hasBrokerKeywords) {
    return false; // Broker
  }
  
  // Check for agent images
  if (text.includes('/agents/') || text.includes('/developers/')) {
    return false; // Broker
  }
  
  // Check for "פרטי" label (explicit private)
  if (text.includes('פרטי')) {
    return true; // Private
  }
  
  // Default to private for Madlan if no broker indicators
  return true;
}

function classifyHomeless(rawText: string, description: string): boolean {
  if (!rawText && !description) return true; // Homeless is mostly private
  
  const text = `${rawText || ''} ${description || ''}`;
  const textLower = text.toLowerCase();
  
  // Check broker keywords
  const hasBrokerKeywords = brokerKeywords.some(k => 
    textLower.includes(k.toLowerCase())
  );
  
  return !hasBrokerKeywords;
}

interface PropertyToProcess {
  id: string;
  source: string;
  source_url: string;
  description: string | null;
  is_private: boolean | null;
  features: Record<string, unknown> | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { 
      source, 
      batchSize = 50, 
      offset = 0, 
      dryRun = false,
      cancelRequested = false,
      scrapeFromSource = false // If true, re-scrape from original URL
    } = body;

    console.log(`[Backfill Broker] source=${source || 'all'}, offset=${offset}, batchSize=${batchSize}, dryRun=${dryRun}, scrape=${scrapeFromSource}`);

    // Handle cancel
    if (cancelRequested) {
      await supabase
        .from('backfill_progress')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('task_name', 'backfill_broker_classification')
        .eq('status', 'running');
      
      return new Response(JSON.stringify({ success: true, cancelled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get or create progress record
    const taskName = 'backfill_broker_classification';
    let progressId: string;
    
    const { data: existingProgress } = await supabase
      .from('backfill_progress')
      .select('*')
      .eq('task_name', taskName)
      .eq('status', 'running')
      .single();

    if (existingProgress) {
      // MUTEX CHECK
      const lastUpdate = new Date(existingProgress.updated_at || existingProgress.started_at);
      const secondsSinceUpdate = (Date.now() - lastUpdate.getTime()) / 1000;
      
      if (secondsSinceUpdate < 15) {
        console.log(`Skipping - another instance is processing`);
        return new Response(JSON.stringify({
          success: true,
          skipped: true,
          message: 'Processing in progress by another instance'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      progressId = existingProgress.id;
      await supabase
        .from('backfill_progress')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', progressId);
    } else {
      // Count total properties
      let countQuery = supabase
        .from('scouted_properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (source) {
        countQuery = countQuery.eq('source', source);
      }
      
      const { count: totalCount } = await countQuery;

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
    let query = supabase
      .from('scouted_properties')
      .select('id, source, source_url, description, is_private, features')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (source) {
      query = query.eq('source', source);
    }

    const { data: properties, error: fetchError } = await query;

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

    console.log(`Processing ${properties.length} properties...`);

    let updated = 0;
    let unchanged = 0;
    let scraped = 0;
    const updates: { id: string; is_private: boolean; raw_text?: string }[] = [];

    for (const prop of properties) {
      let rawText = '';
      let description = prop.description || '';

      // If scrapeFromSource is true and we have a valid URL, re-scrape
      if (scrapeFromSource && prop.source_url && firecrawlKey) {
        try {
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: prop.source_url,
              formats: ['markdown'],
              onlyMainContent: true,
              timeout: 15000
            })
          });

          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            rawText = scrapeData.data?.markdown || '';
            scraped++;
          }
        } catch (err) {
          console.error(`Scrape failed for ${prop.id}:`, err);
        }
        
        // Small delay between scrapes
        await new Promise(r => setTimeout(r, 300));
      }

      let newIsPrivate: boolean;

      switch (prop.source) {
        case 'yad2':
          newIsPrivate = classifyYad2(rawText, description);
          break;
        case 'madlan':
          newIsPrivate = classifyMadlan(rawText, description);
          break;
        case 'homeless':
          newIsPrivate = classifyHomeless(rawText, description);
          break;
        default:
          continue;
      }

      // Only update if classification changed or we have new raw_text
      if (prop.is_private !== newIsPrivate || (rawText && rawText.length > 100)) {
        updates.push({ 
          id: prop.id, 
          is_private: newIsPrivate,
          raw_text: rawText.length > 100 ? rawText.substring(0, 2000) : undefined
        });
        updated++;
      } else {
        unchanged++;
      }
    }

    console.log(`Found ${updates.length} properties to update (${unchanged} unchanged)`);

    if (!dryRun && updates.length > 0) {
      for (const update of updates) {
        const updateData: Record<string, unknown> = { is_private: update.is_private };
        if (update.raw_text) {
          updateData.raw_text = update.raw_text;
        }
        
        const { error: updateError } = await supabase
          .from('scouted_properties')
          .update(updateData)
          .eq('id', update.id);

        if (updateError) {
          console.error(`Error updating ${update.id}:`, updateError);
        }
      }
    }

    // Update progress
    const { data: currentProgress } = await supabase
      .from('backfill_progress')
      .select('processed_items, successful_items')
      .eq('id', progressId)
      .single();

    const newProcessed = (currentProgress?.processed_items || 0) + properties.length;
    const newSuccessful = (currentProgress?.successful_items || 0) + updated;

    await supabase
      .from('backfill_progress')
      .update({
        processed_items: newProcessed,
        successful_items: newSuccessful,
        updated_at: new Date().toISOString()
      })
      .eq('id', progressId);

    const hasMore = properties.length === batchSize;

    // Auto-trigger next batch if there are more
    if (hasMore && !dryRun) {
      const nextOffset = offset + batchSize;
      console.log(`Triggering next batch at offset ${nextOffset}...`);
      
      fetch(`${supabaseUrl}/functions/v1/backfill-broker-classification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ source, batchSize, offset: nextOffset, dryRun, scrapeFromSource })
      }).catch(err => console.error('Error triggering next batch:', err));
    }

    return new Response(JSON.stringify({
      success: true,
      processed: properties.length,
      updated,
      unchanged,
      scraped,
      hasMore,
      nextOffset: hasMore ? offset + batchSize : null,
      dryRun
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Backfill Broker] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
