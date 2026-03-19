import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const url = body.url || 'https://www.madlan.co.il/for-rent/tel-aviv-jaffa';
  const useNewHeaders = body.new_headers !== false;

  const headers: Record<string, string> = useNewHeaders 
    ? { 'Accept': 'application/json', 'X-Nextjs-Data': '1', 'Accept-Language': 'he-IL,he;q=0.9' }
    : { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' };

  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 8000);
    const r = await fetch(url, { method: 'GET', headers, signal: c.signal });
    clearTimeout(t);
    const txt = await r.text();
    return new Response(JSON.stringify({
      url, headers_used: useNewHeaders ? 'new' : 'old',
      status: r.status, len: txt.length,
      isBlock: r.status === 403,
      hasListings: txt.includes('data-auto-bulletin-id'),
      snippet: txt.substring(0, 200),
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
