import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOKEN = 'stdj4mbn';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
  'Referer': 'https://www.yad2.co.il/',
  'Origin': 'https://www.yad2.co.il',
};

async function testOne(name: string, url: string, headers: Record<string, string>): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const start = Date.now();
    const res = await fetch(url, { headers, signal: ctrl.signal });
    const elapsed = Date.now() - start;
    const text = await res.text();
    clearTimeout(timer);

    let preview: any = {};
    try {
      const j = JSON.parse(text);
      preview = { topKeys: Object.keys(j).slice(0, 15), hasPrice: 'price' in j, hasInProperty: 'inProperty' in j };
    } catch {
      if (text.includes('__NEXT_DATA__')) {
        const m = text.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (m) {
          try {
            const pp = JSON.parse(m[1])?.props?.pageProps;
            preview = { nextDataKeys: pp ? Object.keys(pp).slice(0, 15) : null, hasPrice: m[1].includes('"price"') };
          } catch { preview = { nextData: 'parse_error' }; }
        }
      }
    }

    return { method: name, status: res.status, ms: elapsed, bytes: text.length, preview, body_start: text.substring(0, 200) };
  } catch (e) {
    clearTimeout(timer);
    return { method: name, error: e instanceof Error ? e.message : String(e) };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const token = body.token || TOKEN;
  const method = body.method || 'all'; // 1-5 or 'all'

  const tests: Record<string, [string, Record<string, string>]> = {
    '1': [`https://gw.yad2.co.il/realestate-item/${token}`, { 'Accept': 'application/json' }],
    '2': [`https://gw.yad2.co.il/realestate-item/${token}`, { ...BROWSER_HEADERS, 'Accept': 'application/json' }],
    '3': [`https://gw.yad2.co.il/feed-search/realestate/rent?token=${token}`, { ...BROWSER_HEADERS, 'Accept': 'application/json' }],
    '4': [`https://www.yad2.co.il/realestate/item/${token}`, { ...BROWSER_HEADERS, 'Accept': 'text/html' }],
    '5': [`https://api.yad2.co.il/realestate-item/${token}`, { ...BROWSER_HEADERS, 'Accept': 'application/json' }],
  };

  const keys = method === 'all' ? ['1', '2'] : [method]; // start with 1+2 to avoid timeout
  const results = [];
  for (const k of keys) {
    const t = tests[k];
    if (!t) continue;
    results.push(await testOne(`method_${k}`, t[0], t[1]));
  }

  return new Response(JSON.stringify({ token, results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
