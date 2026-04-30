// Debug edge function: probe several header strategies against a Madlan listing URL
// from the Supabase edge runtime IP, to find what bypasses 403.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

interface Strategy {
  name: string;
  headers: Record<string, string>;
}

const STRATEGIES: Strategy[] = [
  {
    name: 'A. minimal (current backfill — Next.js)',
    headers: { 'Accept': 'application/json', 'X-Nextjs-Data': '1', 'Accept-Language': 'he-IL,he;q=0.9' },
  },
  {
    name: 'B. minimal HTML, no UA (current scout-madlan-direct strategy)',
    headers: { 'Accept': 'text/html', 'Accept-Language': 'he-IL,he;q=0.9' },
  },
  {
    name: 'C. iPhone Safari UA + nav headers',
    headers: {
      'User-Agent': IPHONE_UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'he-IL,he;q=0.9',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1',
    },
  },
  {
    name: 'D. Desktop Chrome UA + nav headers',
    headers: {
      'User-Agent': CHROME_UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'he-IL,he;q=0.9',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1',
    },
  },
  {
    name: 'E. iPhone UA + Accept text/html only (no Sec-*)',
    headers: {
      'User-Agent': IPHONE_UA,
      'Accept': 'text/html',
      'Accept-Language': 'he-IL,he;q=0.9',
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const reqUrl = new URL(req.url);
  const target = reqUrl.searchParams.get('url') || 'https://www.madlan.co.il/listings/C5KeZ2T5nXN';

  const results: any[] = [];
  for (const s of STRATEGIES) {
    const start = Date.now();
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 25000);
      const r = await fetch(target, { method: 'GET', headers: s.headers, signal: ctrl.signal });
      clearTimeout(t);
      const html = await r.text();
      const ms = Date.now() - start;
      results.push({
        strategy: s.name,
        status: r.status,
        bytes: html.length,
        ms,
        hasSsrCtx: html.includes('__SSR_HYDRATED_CONTEXT__'),
        hasNextData: html.includes('__NEXT_DATA__'),
        hasYitronot: html.includes('יתרונות הנכס'),
        hasMifratMale: html.includes('מפרט מלא'),
        hasMadlanTitle: /<title>\s*Madlan\s*<\/title>/i.test(html),
        hasCaptcha: html.toLowerCase().includes('captcha'),
        hasRadware: html.includes('Radware'),
        snippet: html.slice(0, 250),
      });
    } catch (e) {
      results.push({ strategy: s.name, error: String(e), ms: Date.now() - start });
    }
    // small delay between strategies
    await new Promise(r => setTimeout(r, 500));
  }

  return new Response(JSON.stringify({ url: target, results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
