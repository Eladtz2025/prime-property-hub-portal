import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOKEN = 'stdj4mbn'; // known active listing

async function testMethod(name: string, fn: () => Promise<Response>): Promise<any> {
  try {
    const start = Date.now();
    const res = await fn();
    const elapsed = Date.now() - start;
    const text = await res.text();
    
    let dataPreview: any = null;
    let isJson = false;
    try {
      const parsed = JSON.parse(text);
      isJson = true;
      // Show key structure
      if (typeof parsed === 'object' && parsed !== null) {
        dataPreview = {
          topKeys: Object.keys(parsed).slice(0, 20),
          hasPrice: text.includes('"price"'),
          hasRooms: text.includes('"room') || text.includes('"Room'),
          hasInProperty: text.includes('"inProperty"'),
          hasAdType: text.includes('"adType"'),
        };
      }
    } catch { /* not JSON */ }

    // Check for __NEXT_DATA__ in HTML
    let nextDataKeys: string[] | null = null;
    if (!isJson && text.includes('__NEXT_DATA__')) {
      const match = text.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (match) {
        try {
          const nd = JSON.parse(match[1]);
          const pp = nd?.props?.pageProps;
          nextDataKeys = pp ? Object.keys(pp).slice(0, 15) : ['no pageProps'];
          dataPreview = { nextDataKeys, hasPrice: match[1].includes('"price"') };
          isJson = true;
        } catch { nextDataKeys = ['parse_error']; }
      }
    }

    return {
      method: name,
      status: res.status,
      elapsed_ms: elapsed,
      content_type: res.headers.get('content-type'),
      body_length: text.length,
      is_json: isJson,
      has_next_data: text.includes('__NEXT_DATA__'),
      data_preview: dataPreview,
      body_start: text.substring(0, 300),
    };
  } catch (e) {
    return { method: name, error: e instanceof Error ? e.message : String(e) };
  }
}

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
  'Referer': 'https://www.yad2.co.il/',
  'Origin': 'https://www.yad2.co.il',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const token = body.token || TOKEN;

  const results = await Promise.all([
    // Method 1: Gateway API - minimal headers
    testMethod('1_gateway_minimal', () =>
      fetch(`https://gw.yad2.co.il/realestate-item/${token}`, {
        headers: { 'Accept': 'application/json' },
      })
    ),

    // Method 2: Gateway API - browser headers
    testMethod('2_gateway_browser', () =>
      fetch(`https://gw.yad2.co.il/realestate-item/${token}`, {
        headers: { ...BROWSER_HEADERS, 'Accept': 'application/json' },
      })
    ),

    // Method 3: Feed search endpoint
    testMethod('3_feed_search', () =>
      fetch(`https://gw.yad2.co.il/feed-search/realestate/rent?token=${token}`, {
        headers: { ...BROWSER_HEADERS, 'Accept': 'application/json' },
      })
    ),

    // Method 4: HTML page + __NEXT_DATA__
    testMethod('4_html_nextdata', () =>
      fetch(`https://www.yad2.co.il/realestate/item/${token}`, {
        headers: {
          ...BROWSER_HEADERS,
          'Accept': 'text/html,application/xhtml+xml',
        },
      })
    ),

    // Method 5: api.yad2.co.il domain
    testMethod('5_api_domain', () =>
      fetch(`https://api.yad2.co.il/realestate-item/${token}`, {
        headers: { ...BROWSER_HEADERS, 'Accept': 'application/json' },
      })
    ),
  ]);

  // Summary
  const summary = results.map(r => ({
    method: r.method,
    status: r.status || 'error',
    json: r.is_json || false,
    size: r.body_length || 0,
    ms: r.elapsed_ms || 0,
    verdict: r.error ? '❌ ' + r.error :
      (r.status === 200 && r.is_json) ? '✅ JSON data!' :
      (r.status === 200 && r.has_next_data) ? '✅ HTML with __NEXT_DATA__' :
      r.status === 200 ? '⚠️ 200 but no structured data' :
      `❌ HTTP ${r.status}`,
  }));

  console.log('=== Yad2 Direct API Test Results ===');
  for (const s of summary) {
    console.log(`${s.method}: ${s.verdict} (${s.size} bytes, ${s.ms}ms)`);
  }

  return new Response(JSON.stringify({ token, summary, details: results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
