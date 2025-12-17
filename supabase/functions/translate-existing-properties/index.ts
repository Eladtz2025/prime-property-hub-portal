import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function translateText(hebrewText: string, fieldType: string): Promise<string> {
  if (!hebrewText || hebrewText.trim() === '') return '';
  
  const systemPrompt = `You are a professional real estate translator specializing in Israeli property listings. 
Translate the following Hebrew text to English. Keep it natural and professional.
For property titles: Keep them concise and appealing.
For descriptions: Maintain the tone and include all details.
For neighborhoods: Use the commonly known English name if one exists, otherwise transliterate appropriately.
Only return the translated text, nothing else.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Translate this ${fieldType} from Hebrew to English:\n\n${hebrewText}` }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Translation API error:', errorText);
    throw new Error(`Translation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting translation of existing properties...');
    
    // Get all properties that need translation
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, title, description, neighborhood, title_en, description_en, neighborhood_en')
      .or('title.neq.,description.neq.,neighborhood.neq.')
      .is('title_en', null);

    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }

    console.log(`📋 Found ${properties?.length || 0} properties to translate`);

    const results = {
      total: properties?.length || 0,
      translated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process properties in batches to avoid rate limits
    for (const property of properties || []) {
      try {
        console.log(`\n📝 Translating property ${property.id}...`);
        
        const updates: Record<string, string> = {};
        
        // Translate title if exists and no English version
        if (property.title && !property.title_en) {
          console.log(`  - Translating title: "${property.title.substring(0, 30)}..."`);
          updates.title_en = await translateText(property.title, 'property title');
          console.log(`  ✅ Title translated: "${updates.title_en.substring(0, 30)}..."`);
        }
        
        // Translate description if exists and no English version
        if (property.description && !property.description_en) {
          console.log(`  - Translating description...`);
          updates.description_en = await translateText(property.description, 'property description');
          console.log(`  ✅ Description translated`);
        }
        
        // Translate neighborhood if exists and no English version  
        if (property.neighborhood && !property.neighborhood_en) {
          console.log(`  - Translating neighborhood: "${property.neighborhood}"`);
          updates.neighborhood_en = await translateText(property.neighborhood, 'neighborhood name');
          console.log(`  ✅ Neighborhood translated: "${updates.neighborhood_en}"`);
        }
        
        // Update property if we have translations
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('properties')
            .update(updates)
            .eq('id', property.id);
          
          if (updateError) {
            console.error(`  ❌ Error updating property ${property.id}:`, updateError);
            results.errors.push(`${property.id}: ${updateError.message}`);
          } else {
            console.log(`  ✅ Property ${property.id} updated successfully`);
            results.translated++;
          }
        } else {
          console.log(`  ⏭️ Skipping property ${property.id} - nothing to translate`);
          results.skipped++;
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (propError: any) {
        console.error(`❌ Error processing property ${property.id}:`, propError);
        results.errors.push(`${property.id}: ${propError.message}`);
      }
    }

    console.log('\n🎉 Translation completed!');
    console.log(`  Total: ${results.total}`);
    console.log(`  Translated: ${results.translated}`);
    console.log(`  Skipped: ${results.skipped}`);
    console.log(`  Errors: ${results.errors.length}`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Translation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
