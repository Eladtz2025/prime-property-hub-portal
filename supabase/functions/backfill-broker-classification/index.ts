import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Broker detection keywords
const brokerKeywords = [
  'תיווך', 'סוכנות', 'משרד', 'נדל"ן', 'נדלן',
  'REAL ESTATE', 'Premium', 'ניהול נכסים', 'נכסים', 
  'Properties', 'HomeMe', 'הומלנד', 'בית ממכר',
  'רימקס', 'אנגלו סכסון', 're/max', 'remax', 'century 21',
  'קולדוול בנקר', 'coldwell', 'מתווך', 'מתווכת', 'agency',
  'ריאלטי', 'realty', 'קבוצת', 'group', 'אחוזות', 'broker'
];

function classifyYad2(rawText: string): boolean {
  if (!rawText) return false; // Unknown = assume broker
  
  // Remove RTL markers
  const cleaned = rawText
    .replace(/[\u200F\u200E‎‏]/g, '')
    .replace(/\\{2,}/g, '\\');
  
  // SIMPLE RULE: Private = price comes right after backslash
  // Pattern: "\\₪" or "\\ ₪" means private
  const isPrivatePattern = /\\\s*₪/.test(cleaned);
  
  // Check for repeated agency name (definite broker)
  const agencyRepeatedPattern = /([A-Za-z\u0590-\u05FF][A-Za-z\u0590-\u05FF\s.'"-]+?)\s*\\+\s*\1\s*₪/;
  const hasAgencyRepeated = agencyRepeatedPattern.test(cleaned);
  
  // Check for broker keywords
  const hasBrokerKeywords = brokerKeywords.some(k => 
    cleaned.toLowerCase().includes(k.toLowerCase())
  );
  
  // Private if: price comes right after backslash AND no agency repeated AND no broker keywords
  const isPrivate = isPrivatePattern && !hasAgencyRepeated && !hasBrokerKeywords;
  
  return isPrivate;
}

function classifyMadlan(rawText: string): boolean {
  if (!rawText) return false; // Unknown = assume broker
  
  const text = rawText.toLowerCase();
  
  // Check for "תיווך" label at end of block (Madlan specific)
  if (/תיווך\s*$/m.test(rawText)) {
    return false; // Broker
  }
  
  // Check broker keywords
  const hasBrokerKeywords = brokerKeywords.some(k => 
    text.includes(k.toLowerCase())
  );
  
  if (hasBrokerKeywords) {
    return false; // Broker
  }
  
  // Check for "פרטי" label
  if (rawText.includes('פרטי')) {
    return true; // Private
  }
  
  // Default to broker if uncertain
  return false;
}

function classifyHomeless(rawText: string): boolean {
  if (!rawText) return true; // Homeless is mostly private
  
  const text = rawText.toLowerCase();
  
  // Check broker keywords
  const hasBrokerKeywords = brokerKeywords.some(k => 
    text.includes(k.toLowerCase())
  );
  
  return !hasBrokerKeywords;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { source, batchSize = 500, offset = 0, dryRun = false } = await req.json();

    console.log(`[Backfill] Starting classification update - source: ${source || 'all'}, offset: ${offset}, batchSize: ${batchSize}, dryRun: ${dryRun}`);

    // Build query
    let query = supabase
      .from('scouted_properties')
      .select('id, source, raw_text, is_private')
      .not('raw_text', 'is', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (source) {
      query = query.eq('source', source);
    }

    const { data: properties, error } = await query;

    if (error) {
      throw error;
    }

    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No more properties to process',
        processed: 0,
        updated: 0,
        hasMore: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Backfill] Processing ${properties.length} properties...`);

    let updated = 0;
    const updates: { id: string; is_private: boolean }[] = [];

    for (const prop of properties) {
      let newIsPrivate: boolean;

      switch (prop.source) {
        case 'yad2':
          newIsPrivate = classifyYad2(prop.raw_text);
          break;
        case 'madlan':
          newIsPrivate = classifyMadlan(prop.raw_text);
          break;
        case 'homeless':
          newIsPrivate = classifyHomeless(prop.raw_text);
          break;
        default:
          continue; // Skip unknown sources
      }

      // Only update if classification changed
      if (prop.is_private !== newIsPrivate) {
        updates.push({ id: prop.id, is_private: newIsPrivate });
      }
    }

    console.log(`[Backfill] Found ${updates.length} properties to update`);

    if (!dryRun && updates.length > 0) {
      // Batch update using individual updates (Supabase doesn't support batch update with different values)
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('scouted_properties')
          .update({ is_private: update.is_private })
          .eq('id', update.id);

        if (updateError) {
          console.error(`[Backfill] Error updating ${update.id}:`, updateError);
        } else {
          updated++;
        }
      }
    } else if (dryRun) {
      updated = updates.length;
    }

    const hasMore = properties.length === batchSize;

    // Auto-trigger next batch if there are more
    if (hasMore && !dryRun) {
      const nextOffset = offset + batchSize;
      console.log(`[Backfill] Triggering next batch at offset ${nextOffset}...`);
      
      // Don't await - fire and forget
      fetch(`${supabaseUrl}/functions/v1/backfill-broker-classification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ source, batchSize, offset: nextOffset, dryRun })
      }).catch(err => console.error('[Backfill] Error triggering next batch:', err));
    }

    const result = {
      success: true,
      processed: properties.length,
      updated,
      toUpdate: updates.length,
      hasMore,
      nextOffset: hasMore ? offset + batchSize : null,
      dryRun,
      sampleUpdates: updates.slice(0, 5).map(u => ({ id: u.id.slice(0, 8), is_private: u.is_private }))
    };

    console.log(`[Backfill] Batch complete:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Backfill] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
