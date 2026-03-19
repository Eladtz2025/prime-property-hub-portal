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

  // Test 1: Check what's in the 403 body
  try {
    const c1 = new AbortController();
    const t1 = setTimeout(() => c1.abort(), 15000);
    const r1 = await fetch(testUrl, {
      headers: { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' },
      signal: c1.signal,
    });
    clearTimeout(t1);
    const body = await r1.text();
    const headers: Record<string,string> = {};
    r1.headers.forEach((v, k) => headers[k] = v);
    results['test1_403_details'] = { 
      status: r1.status, 
      bodyLength: body.length,
      bodySnippet: body.substring(0, 500),
      responseHeaders: headers,
    };
  } catch (e) {
    results['test1_403_details'] = { error: String(e) };
  }

  // Test 2: Try Jina as fallback for madlan
  try {
    const c2 = new AbortController();
    const t2 = setTimeout(() => c2.abort(), 20000);
    const r2 = await fetch(`https://r.jina.ai/${testUrl}`, {
      headers: {
        'Accept': 'text/markdown',
        'X-Wait-For-Selector': 'body',
        'X-Timeout': '15',
        'X-Locale': 'he-IL',
        'X-No-Cache': 'true',
      },
      signal: c2.signal,
    });
    clearTimeout(t2);
    const body2 = await r2.text();
    results['test2_jina'] = { 
      status: r2.status, 
      bodyLength: body2.length,
      bodySnippet: body2.substring(0, 500),
    };
  } catch (e) {
    results['test2_jina'] = { error: String(e) };
  }

  // Test 3: Try with Referer from madlan itself
  try {
    const c3 = new AbortController();
    const t3 = setTimeout(() => c3.abort(), 15000);
    const r3 = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.madlan.co.il/',
        'Origin': 'https://www.madlan.co.il',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
      },
      signal: c3.signal,
    });
    clearTimeout(t3);
    const body3 = await r3.text();
    results['test3_with_referer'] = { status: r3.status, bodyLength: body3.length };
  } catch (e) {
    results['test3_with_referer'] = { error: String(e) };
  }

  // Test 4: Try Madlan's internal API endpoint directly
  try {
    const listingId = 'ds0nyz2Jy7f';
    const apiUrl = `https://www.madlan.co.il/api2/v1/listing/${listingId}`;
    const c4 = new AbortController();
    const t4 = setTimeout(() => c4.abort(), 15000);
    const r4 = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'he-IL,he;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Referer': testUrl,
      },
      signal: c4.signal,
    });
    clearTimeout(t4);
    const body4 = await r4.text();
    results['test4_madlan_api'] = { 
      status: r4.status, 
      bodyLength: body4.length,
      bodySnippet: body4.substring(0, 300),
    };
  } catch (e) {
    results['test4_madlan_api'] = { error: String(e) };
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
