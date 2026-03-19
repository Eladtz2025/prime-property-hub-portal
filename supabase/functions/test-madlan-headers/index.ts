import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Test both list pages AND individual property pages
  const testUrls = [
    { url: 'https://www.madlan.co.il/for-rent/tel-aviv-jaffa', type: 'list-rent' },
    { url: 'https://www.madlan.co.il/for-sale/tel-aviv-jaffa', type: 'list-sale' },
    { url: 'https://www.madlan.co.il/listings/for-rent/tel-aviv-jaffa?page=2', type: 'list-rent-p2' },
  ];

  const results: any[] = [];

  for (let i = 0; i < testUrls.length; i++) {
    const t = testUrls[i];
    try {
      const c = new AbortController();
      const tid = setTimeout(() => c.abort(), 12000);
      const r = await fetch(t.url, { 
        method: 'GET', 
        headers: { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' },
        signal: c.signal 
      });
      clearTimeout(tid);
      const body = await r.text();
      results.push({
        type: t.type,
        status: r.status,
        len: body.length,
        hasListings: body.includes('data-auto-bulletin-id'),
        isBlock: r.status === 403 || body.includes('סליחה על ההפרעה'),
        snippet: body.substring(0, 200),
      });
    } catch (e) {
      results.push({ type: t.type, error: String(e).substring(0, 80) });
    }
    if (i < testUrls.length - 1) await new Promise(r => setTimeout(r, 3000));
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
