import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * TEMP DIAGNOSTIC ONLY — does not touch DB, does not change scout flow.
 * Tries multiple Madlan API endpoints to see if any return search results
 * directly (bypassing Cloudflare HTML on /for-rent/...).
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const results: any[] = [];

  // Attempt 1: GraphQL searchPois query (guess based on detail-parser pattern)
  const graphqlAttempts = [
    {
      name: 'graphql_searchPois',
      url: 'https://www.madlan.co.il/api2',
      body: {
        operationName: 'searchPois',
        variables: {
          input: {
            dealType: 'rent',
            address: 'תל אביב יפו ישראל',
            page: 1,
          },
        },
        query: `query searchPois($input: SearchInput!) { searchPois(input: $input) { id price rooms area floor address neighborhood city pocType } }`,
      },
    },
    {
      name: 'graphql_searchPoisV2',
      url: 'https://www.madlan.co.il/api2',
      body: {
        operationName: 'searchPois',
        variables: { dealType: 'rent', city: 'תל אביב יפו', page: 1 },
        query: `query searchPois($dealType: String!, $city: String!, $page: Int) { searchPois(dealType: $dealType, city: $city, page: $page) { id price rooms address } }`,
      },
    },
  ];

  for (const a of graphqlAttempts) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(a.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': 'he-IL,he;q=0.9',
        },
        body: JSON.stringify(a.body),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const text = await res.text();
      results.push({
        name: a.name,
        status: res.status,
        len: text.length,
        snippet: text.substring(0, 400),
      });
    } catch (e) {
      results.push({ name: a.name, error: String(e) });
    }
  }

  // Attempt 2: Try the Next.js /_next/data/<buildId>/... path with a *known buildId*
  // We'd need to discover buildId; try the common case from a fresh detail page.
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    // Detail pages currently work — fetch one and grab buildId
    const detailRes = await fetch('https://www.madlan.co.il/listings/1Xcd5eXJA2P', {
      headers: {
        'Accept': 'text/html',
        'X-Nextjs-Data': '1',
        'Accept-Language': 'he-IL,he;q=0.9',
      },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    const html = await detailRes.text();
    const m = html.match(/"buildId":"([^"]+)"/);
    const buildId = m?.[1];
    results.push({ name: 'detail_buildId', status: detailRes.status, buildId, html_len: html.length });

    if (buildId) {
      // Try the Next.js search-data endpoint
      const searchUrl = `https://www.madlan.co.il/_next/data/${buildId}/for-rent/%D7%AA%D7%9C-%D7%90%D7%91%D7%99%D7%91-%D7%99%D7%A4%D7%95-%D7%99%D7%A9%D7%A8%D7%90%D7%9C.json?page=1`;
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), 15000);
      const sres = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json',
          'X-Nextjs-Data': '1',
          'Accept-Language': 'he-IL,he;q=0.9',
        },
        signal: ctrl2.signal,
      });
      clearTimeout(t2);
      const stext = await sres.text();
      results.push({
        name: 'next_data_search_json',
        url: searchUrl,
        status: sres.status,
        len: stext.length,
        snippet: stext.substring(0, 600),
      });
    }
  } catch (e) {
    results.push({ name: 'next_data_search_json', error: String(e) });
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
