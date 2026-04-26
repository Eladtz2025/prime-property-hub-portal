import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Madlan GraphQL API Reconnaissance Tool
 * Tests known + guessed operations on https://www.madlan.co.il/api2
 */

// Common GraphQL operation names to try for search/list functionality
const SEARCH_QUERIES = [
  // Variant 1: searchPoi - common pattern
  {
    name: 'searchPoi_simple',
    body: {
      operationName: 'searchPoi',
      variables: { city: 'תל אביב יפו', dealType: 'rent', page: 1 },
      query: `query searchPoi($city: String!, $dealType: String!, $page: Int) { searchPoi(city: $city, dealType: $dealType, page: $page) { id price address rooms area floor } }`,
    },
  },
  // Variant 2: feed
  {
    name: 'feed',
    body: {
      operationName: 'feed',
      variables: { dealType: 'rent', page: 1 },
      query: `query feed($dealType: String!, $page: Int) { feed(dealType: $dealType, page: $page) { id price } }`,
    },
  },
  // Variant 3: Empty query - introspection check
  {
    name: 'introspection',
    body: {
      query: `{ __schema { queryType { fields { name args { name type { name kind } } } } } }`,
    },
  },
  // Variant 4: poiSearch
  {
    name: 'poiSearch',
    body: {
      operationName: 'poiSearch',
      variables: { input: { dealType: 'rent', city: 'תל אביב יפו', page: 1 } },
      query: `query poiSearch($input: PoiSearchInput!) { poiSearch(input: $input) { items { id price } total } }`,
    },
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const customQuery = body.custom_query;
  const onlyOne = body.only;

  const queries = customQuery 
    ? [{ name: 'custom', body: customQuery }]
    : (onlyOne ? SEARCH_QUERIES.filter(q => q.name === onlyOne) : SEARCH_QUERIES);

  const results = [];

  for (const q of queries) {
    const start = Date.now();
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 12000);
      const r = await fetch('https://www.madlan.co.il/api2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
          'Referer': 'https://www.madlan.co.il/for-rent/' + encodeURIComponent('תל-אביב-יפו-ישראל'),
          'Origin': 'https://www.madlan.co.il',
          'Accept-Language': 'he-IL,he;q=0.9',
        },
        body: JSON.stringify(q.body),
        signal: c.signal,
      });
      clearTimeout(t);
      const text = await r.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch {}

      results.push({
        operation: q.name,
        status: r.status,
        cf_ray: r.headers.get('cf-ray'),
        duration_ms: Date.now() - start,
        response_size: text.length,
        has_data: parsed?.data ? Object.keys(parsed.data) : null,
        errors: parsed?.errors?.map((e: any) => ({ message: e.message, path: e.path, extensions: e.extensions?.code })),
        snippet: text.substring(0, 600),
      });
    } catch (e) {
      results.push({ operation: q.name, error: String(e), duration_ms: Date.now() - start });
    }
    // gentle pacing
    await new Promise(r => setTimeout(r, 1500));
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
