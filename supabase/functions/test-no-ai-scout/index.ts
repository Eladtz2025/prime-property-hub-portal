import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseMadlanMarkdown } from "../_experimental/parser-madlan.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get saved debug sample
  const { data: sample } = await supabase
    .from('debug_scrape_samples')
    .select('markdown')
    .eq('source', 'madlan')
    .single();

  if (!sample?.markdown) {
    return new Response(JSON.stringify({ error: 'No debug sample found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Parse with NO filter
  const resultAll = parseMadlanMarkdown(sample.markdown, 'rent');
  
  // Parse with private filter
  const resultPrivate = parseMadlanMarkdown(sample.markdown, 'rent', 'private');
  
  // Parse with broker filter
  const resultBroker = parseMadlanMarkdown(sample.markdown, 'rent', 'broker');

  // Show details of each property
  const details = resultAll.properties.map(p => ({
    address: p.address,
    price: p.price,
    rooms: p.rooms,
    is_private: p.is_private,
    source_url: p.source_url,
  }));

  return new Response(JSON.stringify({
    total: resultAll.properties.length,
    stats: resultAll.stats,
    private_filter_count: resultPrivate.properties.length,
    broker_filter_count: resultBroker.properties.length,
    properties: details,
  }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
