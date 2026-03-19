import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const testUrl = 'https://www.madlan.co.il/listings/ds0nyz2Jy7f';

  const results: Record<string, any> = {};

  // Test 1: Current approach (no User-Agent)
  try {
    const controller1 = new AbortController();
    const t1 = setTimeout(() => controller1.abort(), 15000);
    const r1 = await fetch(testUrl, {
      headers: { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' },
      signal: controller1.signal,
    });
    clearTimeout(t1);
    const body1 = await r1.text();
    results['test1_no_ua'] = { status: r1.status, bodyLength: body1.length };
  } catch (e) {
    results['test1_no_ua'] = { error: String(e) };
  }

  // Test 2: With realistic User-Agent
  try {
    const controller2 = new AbortController();
    const t2 = setTimeout(() => controller2.abort(), 15000);
    const r2 = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller2.signal,
    });
    clearTimeout(t2);
    const body2 = await r2.text();
    results['test2_full_browser'] = { status: r2.status, bodyLength: body2.length };
  } catch (e) {
    results['test2_full_browser'] = { error: String(e) };
  }

  // Test 3: Minimal User-Agent only
  try {
    const controller3 = new AbortController();
    const t3 = setTimeout(() => controller3.abort(), 15000);
    const r3 = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'he-IL,he;q=0.9',
      },
      signal: controller3.signal,
    });
    clearTimeout(t3);
    const body3 = await r3.text();
    results['test3_ua_only'] = { status: r3.status, bodyLength: body3.length };
  } catch (e) {
    results['test3_ua_only'] = { error: String(e) };
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
