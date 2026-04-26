import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const url = body.url || 'https://www.madlan.co.il/for-rent/תל-אביב-יפו-ישראל?page=1';

  const headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'he-IL,he;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
  };

  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 20000);
    const r = await fetch(url, { method: 'GET', headers, signal: c.signal, redirect: 'follow' });
    clearTimeout(t);
    const html = await r.text();

    // Try to extract listing IDs
    const listingMatches = [...html.matchAll(/madlan\.co\.il\/listings\/([a-zA-Z0-9_-]+)/g)];
    const uniqueListingIds = [...new Set(listingMatches.map(m => m[1]))];

    // Try to find prices (Hebrew shekel) — pattern: ₪ NUMBER or NUMBER ₪
    const priceMatches = [...html.matchAll(/₪\s*([\d,]+)|([\d,]+)\s*₪/g)];

    // Try to find rooms
    const roomsMatches = [...html.matchAll(/(\d+(?:\.5)?)\s*חדרים?/g)];

    // Find __NEXT_DATA__ if exists
    const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    let nextDataParsed: any = null;
    let nextDataListings: any = null;
    if (nextDataMatch) {
      try {
        nextDataParsed = JSON.parse(nextDataMatch[1]);
        // Try to find listings in the data
        const findListings = (obj: any, depth = 0): any => {
          if (depth > 10 || !obj || typeof obj !== 'object') return null;
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const found = findListings(item, depth + 1);
              if (found) return found;
            }
            return null;
          }
          for (const key of Object.keys(obj)) {
            if (['poi','poiList','listings','bulletins','results','feed'].includes(key) && Array.isArray(obj[key]) && obj[key].length > 0) {
              return { key, count: obj[key].length, sample: obj[key][0] };
            }
            const found = findListings(obj[key], depth + 1);
            if (found) return found;
          }
          return null;
        };
        nextDataListings = findListings(nextDataParsed);
      } catch (e) {
        nextDataListings = { error: String(e) };
      }
    }

    return new Response(JSON.stringify({
      url,
      status: r.status,
      content_length: html.length,
      cf_ray: r.headers.get('cf-ray'),
      
      listing_ids_found: uniqueListingIds.length,
      first_5_listing_ids: uniqueListingIds.slice(0, 5),
      
      price_matches_count: priceMatches.length,
      first_5_prices: priceMatches.slice(0, 5).map(m => m[0]),
      
      rooms_matches_count: roomsMatches.length,
      first_5_rooms: roomsMatches.slice(0, 5).map(m => m[0]),
      
      has_next_data: !!nextDataMatch,
      next_data_size: nextDataMatch ? nextDataMatch[1].length : 0,
      next_data_listings_summary: nextDataListings ? {
        key: nextDataListings.key,
        count: nextDataListings.count,
        sample_keys: nextDataListings.sample ? Object.keys(nextDataListings.sample).slice(0, 30) : null,
      } : null,
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
