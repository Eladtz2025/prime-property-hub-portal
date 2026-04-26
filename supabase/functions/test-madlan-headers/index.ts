import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const path = body.path || 'for-rent/' + encodeURIComponent('תל-אביב-יפו-ישראל');
  const searchUrl = `https://www.madlan.co.il/${path}`;
  const out: any = { stage1: {}, stage2: {} };

  try {
    // STAGE 1
    const htmlRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': IPHONE_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9',
      },
    });
    const html = await htmlRes.text();
    out.stage1.status = htmlRes.status;
    out.stage1.html_length = html.length;

    const listingRefs = [...new Set([...html.matchAll(/\/listings?\/([a-zA-Z0-9_-]{6,40})/g)].map(m => m[1]))];
    out.stage1.listing_ids_count = listingRefs.length;
    out.stage1.listing_ids_sample = listingRefs.slice(0, 5);

    if (listingRefs.length === 0) {
      out.error = 'No listing IDs found in stage 1';
      return new Response(JSON.stringify(out, null, 2), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const targetId = body.testId || listingRefs[0];
    out.stage2.target_id = targetId;
    const attempts: any[] = [];

    // A: Listing page HTML + extract embedded JSON
    try {
      const url = `https://www.madlan.co.il/listings/${targetId}`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': IPHONE_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'he-IL,he;q=0.9',
        },
      });
      const t = await r.text();
      const apolloMatch = t.match(/window\.__APOLLO_STATE__\s*=\s*({[\s\S]*?})\s*;?\s*<\/script>/);
      const nextMatch = t.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      const source = apolloMatch?.[1] || nextMatch?.[1] || t;
      const priceMatch = source.match(/"price"\s*:\s*(\d{4,9})/);
      const roomsMatch = source.match(/"rooms?"\s*:\s*"?(\d+(?:\.\d+)?)/);
      const addrMatch = source.match(/"address(?:Title|String)?"\s*:\s*"([^"]{3,120})"/);
      const sizeMatch = source.match(/"(?:area|squareMeter|size)"\s*:\s*(\d{2,5})/);
      const floorMatch = source.match(/"floor"\s*:\s*"?(-?\d+)/);
      attempts.push({
        method: 'A_listing_page_html',
        url, status: r.status, bytes: t.length,
        has_apollo_state: !!apolloMatch,
        has_next_data: !!nextMatch,
        price: priceMatch?.[1],
        rooms: roomsMatch?.[1],
        address: addrMatch?.[1],
        size: sizeMatch?.[1],
        floor: floorMatch?.[1],
        title_snippet: t.match(/<title>([^<]{0,200})<\/title>/)?.[1],
        body_start: t.substring(0, 300),
      });
    } catch (e) {
      attempts.push({ method: 'A_listing_page_html', error: String(e) });
    }

    // B: GraphQL /api2 poiByIds
    try {
      const gqlBody = {
        operationName: 'poiByIds',
        variables: { ids: [targetId] },
        query: `query poiByIds($ids: [ID!]!) { poiByIds(ids: $ids) { id price addressTitle rooms area floor type __typename } }`,
      };
      const r = await fetch('https://www.madlan.co.il/api2', {
        method: 'POST',
        headers: {
          'User-Agent': IPHONE_UA,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': 'he-IL,he;q=0.9',
          'Origin': 'https://www.madlan.co.il',
          'Referer': 'https://www.madlan.co.il/',
        },
        body: JSON.stringify(gqlBody),
      });
      const t = await r.text();
      attempts.push({
        method: 'B_graphql_poiByIds',
        status: r.status, bytes: t.length,
        body_start: t.substring(0, 800),
      });
    } catch (e) {
      attempts.push({ method: 'B_graphql_poiByIds', error: String(e) });
    }

    // C: REST /api/poi/<id>
    try {
      const url = `https://www.madlan.co.il/api/poi/${targetId}`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': IPHONE_UA,
          'Accept': 'application/json',
          'Accept-Language': 'he-IL,he;q=0.9',
          'Referer': `https://www.madlan.co.il/listings/${targetId}`,
        },
      });
      const t = await r.text();
      attempts.push({ method: 'C_rest_api_poi', url, status: r.status, bytes: t.length, body_start: t.substring(0, 400) });
    } catch (e) {
      attempts.push({ method: 'C_rest_api_poi', error: String(e) });
    }

    out.stage2.attempts = attempts;
    return new Response(JSON.stringify(out, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    out.error = String(e);
    return new Response(JSON.stringify(out, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
