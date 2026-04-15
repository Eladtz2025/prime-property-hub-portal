import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchYad2DetailFeatures } from '../_shared/yad2-detail-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const url = body.url || 'https://www.yad2.co.il/realestate/item/vzas3xxi';
  const mode = body.mode || 'yad2_api';

  if (mode === 'yad2_api') {
    const result = await fetchYad2DetailFeatures(url);
    return new Response(JSON.stringify({ url, result }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fallback: raw fetch
  const res = await fetch(url, {
    headers: { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' },
  });
  const html = await res.text();
  return new Response(JSON.stringify({ status: res.status, size: html.length }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
