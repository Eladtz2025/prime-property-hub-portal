import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * TEST ONLY - Direct Fetch Diagnostic v2
 * Tests multiple fetch strategies against Madlan
 * Does NOT save anything to DB.
 */

const STRATEGIES = {
  // Strategy 1: Minimal headers (like a simple curl)
  minimal: {
    'Accept': 'text/html',
  },
  // Strategy 2: Full browser simulation  
  browser: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
    'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
  },
  // Strategy 3: Googlebot (some sites whitelist)
  googlebot: {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept': 'text/html',
  },
  // Strategy 4: Mobile browser
  mobile: {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'he-IL,he;q=0.9',
  },
  // Strategy 5: No User-Agent at all
  naked: {},
  // Strategy 6: Fetch API default (like Deno's default)
  deno_default: {
    'Accept': '*/*',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const page = body.page ?? 1;
  const city = body.city ?? 'תל-אביב-יפו-ישראל';
  const dealType = body.deal_type ?? 'for-rent';
  const strategy = body.strategy as string | undefined; // specific strategy or "all"

  const baseUrl = `https://www.madlan.co.il/${dealType}/${encodeURIComponent(city)}?page=${page}`;

  const strategiesToTest = strategy && strategy !== 'all' 
    ? { [strategy]: (STRATEGIES as any)[strategy] || {} }
    : STRATEGIES;

  const results: Record<string, any> = {};

  for (const [name, headers] of Object.entries(strategiesToTest)) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: headers as Record<string, string>,
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeoutId);

      const html = await response.text();
      const duration = Date.now() - startTime;

      const uniqueListings = new Set(html.match(/\/listings\/[A-Za-z0-9]+/g) || []);
      const hasPerimeterX = html.includes('_pxUuid') || html.includes('perimeterx');
      const hasCaptcha = html.includes('captcha') || html.includes('CAPTCHA');
      const hasCloudflare = html.includes('cf-browser-verification') || html.includes('cloudflare');

      results[name] = {
        status: response.status,
        html_length: html.length,
        duration_ms: duration,
        unique_listings: uniqueListings.size,
        blocked_by: hasPerimeterX ? 'PerimeterX' : hasCaptcha ? 'CAPTCHA' : hasCloudflare ? 'Cloudflare' : 'none',
        has_content: html.length > 50000,
        sample: html.substring(0, 200),
      };

      console.log(`🧪 ${name}: status=${response.status} | ${html.length} chars | listings=${uniqueListings.size} | blocked=${results[name].blocked_by} | ${duration}ms`);
    } catch (error) {
      results[name] = {
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown',
        duration_ms: Date.now() - startTime,
      };
      console.log(`🧪 ${name}: FAILED - ${results[name].error}`);
    }

    // Small delay between strategies to avoid rate limiting
    if (Object.keys(strategiesToTest).length > 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return new Response(JSON.stringify({ url: baseUrl, page, results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
