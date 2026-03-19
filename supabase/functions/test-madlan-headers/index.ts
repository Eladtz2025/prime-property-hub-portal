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

  // Quick test: just one direct fetch to see current IP status
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 15000);
    const r = await fetch(testUrl, {
      headers: { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' },
      signal: c.signal,
    });
    clearTimeout(t);
    const html = await r.text();
    // Check the _pxhd cookie and server info
    const headers: Record<string,string> = {};
    r.headers.forEach((v, k) => { if (k !== 'set-cookie') headers[k] = v; });
    const pxCookie = r.headers.get('set-cookie') || '';
    results['direct_fetch'] = { 
      status: r.status, 
      bodyLength: html.length,
      server: r.headers.get('server'),
      hasPxCookie: pxCookie.includes('_pxhd'),
    };
  } catch (e) {
    results['direct_fetch'] = { error: String(e) };
  }

  // Test Madlan GraphQL API - this is what their frontend uses
  try {
    const c2 = new AbortController();
    const t2 = setTimeout(() => c2.abort(), 15000);
    const r2 = await fetch('https://www.madlan.co.il/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'he-IL,he;q=0.9',
        'Origin': 'https://www.madlan.co.il',
        'Referer': 'https://www.madlan.co.il/',
      },
      body: JSON.stringify({
        operationName: "GetPoiData",
        variables: { poiId: "ds0nyz2Jy7f" },
        query: `query GetPoiData($poiId: String!) { poi(id: $poiId) { id title address { city { name } neighborhood { name } streetName houseNumber } price dealType } }`
      }),
      signal: c2.signal,
    });
    clearTimeout(t2);
    const body2 = await r2.text();
    results['graphql_api'] = { 
      status: r2.status, 
      bodyLength: body2.length,
      snippet: body2.substring(0, 500),
    };
  } catch (e) {
    results['graphql_api'] = { error: String(e) };
  }

  // Test: Madlan's Next.js data endpoint
  try {
    const c3 = new AbortController();
    const t3 = setTimeout(() => c3.abort(), 15000);
    const r3 = await fetch('https://www.madlan.co.il/_next/data/listings/ds0nyz2Jy7f.json', {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'he-IL,he;q=0.9',
      },
      signal: c3.signal,
    });
    clearTimeout(t3);
    const body3 = await r3.text();
    results['nextjs_data'] = { 
      status: r3.status, 
      bodyLength: body3.length,
      snippet: body3.substring(0, 300),
    };
  } catch (e) {
    results['nextjs_data'] = { error: String(e) };
  }

  // Test: Check if HEAD request works (lighter, might bypass)
  try {
    const c4 = new AbortController();
    const t4 = setTimeout(() => c4.abort(), 10000);
    const r4 = await fetch(testUrl, {
      method: 'HEAD',
      headers: { 'Accept': '*/*' },
      signal: c4.signal,
    });
    clearTimeout(t4);
    // Must consume for HEAD
    results['head_request'] = { 
      status: r4.status,
      contentLength: r4.headers.get('content-length'),
    };
  } catch (e) {
    results['head_request'] = { error: String(e) };
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
