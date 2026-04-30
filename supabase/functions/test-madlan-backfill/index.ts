// Quick verification: runs fetchMadlanDetailFeatures end-to-end and returns the parsed result.
// Used only to verify the iPhone UA fix produces real features. Safe to delete after verification.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchMadlanDetailFeatures } from "../_shared/madlan-detail-parser.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = new URL(req.url);
  const target = url.searchParams.get('url');
  if (!target) {
    return new Response(JSON.stringify({ error: 'missing url param' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const start = Date.now();
  const result = await fetchMadlanDetailFeatures(target);
  return new Response(JSON.stringify({
    url: target,
    elapsedMs: Date.now() - start,
    result,
    featureCount: result ? Object.keys(result.features).length : 0,
  }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
