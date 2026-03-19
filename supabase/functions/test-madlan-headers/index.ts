import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const testId = body.test || 1;
  // A known active Madlan property URL for testing
  const url = body.url || 'https://www.madlan.co.il/listings/דירה-להשכרה-גדליה-1-תל-אביב-יפו-1';

  const results: any[] = [];

  async function tryFetch(label: string, fetchUrl: string, opts: RequestInit = {}): Promise<any> {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 8000);
      const r = await fetch(fetchUrl, { ...opts, signal: c.signal });
      clearTimeout(t);
      const txt = await r.text();
      return {
        label, status: r.status, len: txt.length,
        hasData: txt.includes('data-auto') || txt.includes('bulletinId'),
        isBlock: r.status === 403 || txt.includes('סליחה על ההפרעה'),
        snippet: txt.substring(0, 200),
      };
    } catch (e) {
      return { label, error: String(e).substring(0, 80) };
    }
  }

  if (testId === 1) {
    // Test 1: Google Webcache
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
    results.push(await tryFetch('google-cache', cacheUrl));
  }

  if (testId === 2) {
    // Test 2: Madlan's internal API (they have a GraphQL/REST API)
    // Try to find the API endpoint that the frontend uses
    const apiUrl = 'https://www.madlan.co.il/api2';
    // Madlan uses a GraphQL API - let's try a simple query
    results.push(await tryFetch('madlan-api-graphql', apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://www.madlan.co.il',
        'Referer': 'https://www.madlan.co.il/',
      },
      body: JSON.stringify({
        operationName: 'searchBulletins',
        variables: {
          filterBy: { dealType: 'rent', city: 'תל אביב יפו' },
          limit: 5
        },
        query: `query searchBulletins($filterBy: BulletinFilterInput, $limit: Int) {
          searchBulletins(filterBy: $filterBy, limit: $limit) {
            bulletins { id address { streetName houseNumber } price }
          }
        }`
      }),
    }));
  }

  if (testId === 3) {
    // Test 3: Try Madlan's Next.js data endpoint (_next/data)
    // Madlan is built on Next.js - it has JSON data endpoints
    const nextDataUrl = url.replace('https://www.madlan.co.il', 'https://www.madlan.co.il/_next/data') + '.json';
    results.push(await tryFetch('nextjs-data', nextDataUrl));
    
    // Also try the __NEXT_DATA__ approach via a simple fetch with specific accept
    results.push(await tryFetch('json-accept', url, {
      headers: {
        'Accept': 'application/json',
        'X-Nextjs-Data': '1',
      }
    }));
  }

  if (testId === 4) {
    // Test 4: archive.org wayback machine
    const archiveUrl = `https://web.archive.org/web/2024/${url}`;
    results.push(await tryFetch('archive-org', archiveUrl));
  }

  if (testId === 5) {
    // Test 5: Try different Madlan URL formats
    // Maybe the /listings/ path is blocked but other paths aren't
    results.push(await tryFetch('madlan-homepage', 'https://www.madlan.co.il/', {
      headers: { 'Accept': '*/*' }
    }));
  }

  if (testId === 6) {
    // Test 6: Fetch via Google's AMP cache or other CDN caches
    const ampUrl = `https://www-madlan-co-il.cdn.ampproject.org/c/s/www.madlan.co.il/listings/`;
    results.push(await tryFetch('amp-cache', ampUrl));
  }

  return new Response(JSON.stringify({ testId, results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
