import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CF_WORKER_URL = 'https://yad2-proxy.taylor-kelly88.workers.dev/';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const url = body.url || 'https://www.yad2.co.il/realestate/item/vzas3xxi';
  const proxyKey = Deno.env.get('YAD2_PROXY_KEY');

  if (!proxyKey) {
    return new Response(JSON.stringify({ error: 'No YAD2_PROXY_KEY' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Test 1: Fetch HTML page via CF proxy
  const resp = await fetch(CF_WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-proxy-key': proxyKey },
    body: JSON.stringify({ url }),
  });
  const proxyData = await resp.json();
  const html = proxyData.html || '';
  
  const results: any = {
    proxy_status: resp.status,
    upstream_status: proxyData.status,
    html_length: html.length,
  };

  // Check for __NEXT_DATA__
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const props = nextData?.props?.pageProps;
      results.has_next_data = true;
      
      // Look for item data
      const item = props?.item || props?.itemData || props?.data;
      if (item) {
        results.item_keys = Object.keys(item);
        results.price = item.price;
        results.rooms = item.roomsCount;
        results.sqm = item.squareMeter;
        results.floor = item.floor;
        results.adType = item.adType;
        results.inProperty = item.inProperty;
        results.neighborhood = item.neighborhood;
        results.street = item.street;
        results.propertyCondition = item.propertyCondition;
        results.description = item.description?.substring(0, 200);
      } else {
        // Explore structure
        results.pageProps_keys = props ? Object.keys(props) : null;
        // Try deeper
        if (props) {
          for (const key of Object.keys(props)) {
            const val = props[key];
            if (val && typeof val === 'object' && !Array.isArray(val)) {
              if (val.price || val.roomsCount || val.inProperty) {
                results.found_at = key;
                results.item_keys = Object.keys(val);
                results.price = val.price;
                results.rooms = val.roomsCount;
                results.inProperty = val.inProperty;
                break;
              }
            }
          }
        }
      }
    } catch (e: any) {
      results.next_data_parse_error = e.message;
    }
  } else {
    results.has_next_data = false;
    // Check if it has any JSON-LD
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    results.has_json_ld = !!jsonLdMatch;
    if (jsonLdMatch) {
      try {
        results.json_ld_preview = JSON.parse(jsonLdMatch[1]);
      } catch {}
    }
    results.html_preview = html.substring(0, 500);
  }

  // Test 2: Try API via proxy
  const token = url.match(/\/item\/([a-z0-9]+)/i)?.[1];
  if (token) {
    const apiResp = await fetch(CF_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-proxy-key': proxyKey },
      body: JSON.stringify({ url: `https://gw.yad2.co.il/realestate-item/${token}` }),
    });
    const apiData = await apiResp.json();
    results.api_proxy_status = apiData.status;
    results.api_proxy_body_length = (apiData.html || '').length;
    if (apiData.status === 200 && apiData.html) {
      try {
        const parsed = JSON.parse(apiData.html);
        results.api_json_keys = Object.keys(parsed);
      } catch {
        results.api_body_preview = (apiData.html || '').substring(0, 300);
      }
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
