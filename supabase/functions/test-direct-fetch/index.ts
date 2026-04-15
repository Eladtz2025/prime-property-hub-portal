import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * TEST ONLY - Madlan detail page structure analysis
 * Fetches a single listing page and reports what data is available.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const url = body.url || 'https://www.madlan.co.il/listings/yDRjYNhIG4I';
  const results: Record<string, any> = {};

  // Fetch with Next.js data headers
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X-Nextjs-Data': '1',
      'Accept-Language': 'he-IL,he;q=0.9',
    },
  });
  const html = await res.text();
  results.status = res.status;
  results.content_type = res.headers.get('content-type');
  results.size = html.length;
  results.is_perimeterx = html.includes('_pxAppId') || html.includes('captcha');

  // Check __NEXT_DATA__
  const nextDataMatch = html.match(/<script\s+id="__NEXT_DATA__"\s+type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nd = JSON.parse(nextDataMatch[1]);
      const pp = nd?.props?.pageProps;
      results.has_next_data = true;
      results.page_props_keys = pp ? Object.keys(pp) : [];

      // Recursive search for amenities
      function findKey(obj: any, target: string, path = '', d = 0): string | null {
        if (!obj || d > 8 || typeof obj !== 'object') return null;
        if (obj[target] !== undefined) return path || '(root)';
        for (const k of Object.keys(obj).slice(0, 50)) {
          const r = findKey(obj[k], target, path ? `${path}.${k}` : k, d + 1);
          if (r) return r;
        }
        return null;
      }

      results.amenities_path = findKey(pp, 'amenities');
      results.area_path = findKey(pp, 'area');
      results.beds_path = findKey(pp, 'beds');
      results.poc_path = findKey(pp, 'poc');

      // If found amenities, extract data
      if (results.amenities_path) {
        const parts = results.amenities_path.split('.');
        let cur = pp;
        for (const p of parts) cur = cur?.[p];
        results.amenities_data = cur?.amenities;
        results.area_data = cur?.area;
        results.beds_data = cur?.beds;
        results.floor_data = cur?.floor;
        results.price_data = cur?.price;
        results.poc_data = cur?.poc;
        results.nearby_keys = Object.keys(cur || {}).filter(k => !['__typename'].includes(k)).slice(0, 30);
      }

      // Also check for Apollo State
      if (pp?.__APOLLO_STATE__) {
        const apollo = pp.__APOLLO_STATE__;
        const apolloKeys = Object.keys(apollo);
        results.apollo_keys_sample = apolloKeys.slice(0, 15);
        // Find Bulletin entries
        const bulletinKeys = apolloKeys.filter(k => k.startsWith('Bulletin:'));
        results.bulletin_count = bulletinKeys.length;
        if (bulletinKeys.length > 0) {
          const firstBulletin = apollo[bulletinKeys[0]];
          results.bulletin_keys = Object.keys(firstBulletin || {}).slice(0, 30);
          results.bulletin_amenities = firstBulletin?.amenities;
          results.bulletin_area = firstBulletin?.area;
          results.bulletin_beds = firstBulletin?.beds;
          results.bulletin_floor = firstBulletin?.floor;
          results.bulletin_price = firstBulletin?.price;
          results.bulletin_poc = firstBulletin?.poc;
        }
      }

      // Preview first 2000 chars of pageProps
      results.pp_preview = JSON.stringify(pp).substring(0, 2000);
    } catch (e) {
      results.parse_error = String(e);
    }
  } else {
    results.has_next_data = false;
    results.html_preview = html.substring(0, 1000);
  }

  // Also test GraphQL
  const id = url.match(/\/listings\/([a-zA-Z0-9_-]+)/)?.[1];
  if (id) {
    const gql = await fetch('https://www.madlan.co.il/api2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'https://www.madlan.co.il', 'Referer': 'https://www.madlan.co.il/' },
      body: JSON.stringify({
        operationName: 'poiByIds',
        query: 'query poiByIds($ids:[PoiIds!]!){poiByIds(ids:$ids){...on Bulletin{amenities{balcony elevator parking}area beds floor price}}}',
        variables: { ids: [{ id, type: 'bulletin' }] },
      }),
    });
    const gqlBody = await gql.text();
    results.graphql_status = gql.status;
    results.graphql_body = gqlBody.substring(0, 300);
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
