import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const url = body.url || 'https://www.madlan.co.il/for-rent/%D7%AA%D7%9C-%D7%90%D7%91%D7%99%D7%91-%D7%99%D7%A4%D7%95-%D7%99%D7%A9%D7%A8%D7%90%D7%9C?page=1';

  const strategies = [
    {
      name: 'minimal',
      headers: { 'Accept': 'text/html', 'Accept-Language': 'he-IL,he;q=0.9' },
    },
    {
      name: 'nextjs-bypass',
      headers: {
        'Accept': 'text/html',
        'X-Nextjs-Data': '1',
        'Accept-Language': 'he-IL,he;q=0.9',
      },
    },
    {
      name: 'browser-like',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
    },
  ];

  const results: any[] = [];

  for (const s of strategies) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const start = Date.now();
      const res = await fetch(url, { headers: s.headers, signal: ctrl.signal });
      const text = await res.text();
      clearTimeout(timer);
      const ms = Date.now() - start;

      const hasSSR = text.includes('__SSR_HYDRATED_CONTEXT__');
      const hasNext = text.includes('__NEXT_DATA__');
      const hasCF = text.toLowerCase().includes('cloudflare') || text.includes('cf-chl-bypass');
      const hasCaptcha = text.toLowerCase().includes('captcha');
      const hasPoi = text.includes('searchPoiV2');

      results.push({
        name: s.name,
        status: res.status,
        ms,
        bytes: text.length,
        hasSSR,
        hasNext,
        hasCF,
        hasCaptcha,
        hasPoi,
        bodyStart: text.substring(0, 300),
      });
    } catch (e) {
      results.push({
        name: s.name,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return new Response(JSON.stringify({ url, results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
