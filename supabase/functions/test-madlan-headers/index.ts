import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STRATEGIES: Record<string, Record<string, string>> = {
  // Browser - latest Chrome on Mac
  'chrome_mac': {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
  },
  // Mobile Safari iPhone
  'safari_iphone': {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'he-IL,he;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
  },
  // Googlebot
  'googlebot': {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept': '*/*',
  },
  // Bingbot
  'bingbot': {
    'User-Agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Accept': '*/*',
  },
  // Next.js JSON API
  'nextjs_json': {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'X-Nextjs-Data': '1',
    'Accept-Language': 'he-IL,he;q=0.9',
  },
  // Bare minimal
  'minimal': {
    'User-Agent': 'curl/8.0.0',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const url = body.url || 'https://www.madlan.co.il/for-rent/תל-אביב-יפו-ישראל?page=1';
  const strategy = body.strategy || 'chrome_mac';

  const headers = STRATEGIES[strategy];
  if (!headers) {
    return new Response(JSON.stringify({ error: `Unknown strategy. Available: ${Object.keys(STRATEGIES).join(', ')}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
    });
  }

  const start = Date.now();
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 15000);
    const r = await fetch(url, { method: 'GET', headers, signal: c.signal, redirect: 'follow' });
    clearTimeout(t);
    const txt = await r.text();
    const duration = Date.now() - start;

    // Detect Cloudflare challenge / block markers
    const isCloudflareBlock = txt.includes('Just a moment') || txt.includes('cf-mitigated') || txt.includes('Attention Required') || txt.includes('Cloudflare');
    const hasListingMarkers = txt.includes('madlan.co.il/listings/') || txt.includes('data-auto-bulletin-id') || txt.includes('"listings"');
    const hasNextData = txt.includes('__NEXT_DATA__');

    return new Response(JSON.stringify({
      url, strategy,
      status: r.status,
      duration_ms: duration,
      content_length: txt.length,
      content_type: r.headers.get('content-type'),
      cf_ray: r.headers.get('cf-ray'),
      cf_mitigated: r.headers.get('cf-mitigated'),
      server: r.headers.get('server'),
      isCloudflareBlock,
      hasListingMarkers,
      hasNextData,
      snippet_start: txt.substring(0, 300),
      snippet_search_listings: (() => {
        const idx = txt.indexOf('madlan.co.il/listings/');
        return idx > -1 ? txt.substring(Math.max(0, idx - 50), idx + 200) : null;
      })(),
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), duration_ms: Date.now() - start }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
