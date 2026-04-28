/**
 * Test the Cloudflare Worker proxy for Yad2/Madlan.
 * Diagnostic only — checks if proxy returns usable HTML and parses __NEXT_DATA__.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const CF_WORKER_URL = 'https://yad2-proxy.taylor-kelly88.workers.dev/';
  const proxyKey = Deno.env.get('YAD2_PROXY_KEY');
  if (!proxyKey) {
    return new Response(JSON.stringify({ error: 'YAD2_PROXY_KEY missing' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const body = await req.json().catch(() => ({}));
  const url = body.url || 'https://www.yad2.co.il/realestate/forsale?topArea=2&area=1&city=5000&propertyGroup=apartments&price=10000-&rooms=1-&page=1';
  const target = body.target || 'yad2';
  const mode = body.mode || 'auto'; // 'item' to deep-dump item

  const t0 = Date.now();
  const resp = await fetch(CF_WORKER_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-proxy-key': proxyKey },
    body: JSON.stringify({ url, target }),
  });
  const json = await resp.json();
  const elapsed = Date.now() - t0;

  const html: string = json.html || '';
  const out: any = {
    cf_worker_status: resp.status,
    upstream_status: json.status,
    elapsed_ms: elapsed,
    html_length: html.length,
    has_next_data: html.includes('__NEXT_DATA__'),
  };

  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (m) {
    try {
      const data = JSON.parse(m[1]);
      const queries = data?.props?.pageProps?.dehydratedState?.queries || [];
      
      if (mode === 'item' || url.includes('/item/')) {
        // Detail page - find item query
        const itemQ = queries.find((q: any) => 
          Array.isArray(q.queryKey) && q.queryKey[0] === 'item'
        );
        if (itemQ) {
          const item = itemQ.state?.data;
          out.item_keys = Object.keys(item || {});
          out.item = {
            token: item.token,
            adNumber: item.adNumber,
            price: item.price,
            description: item.metaData?.description || item.description,
            description_len: (item.metaData?.description || item.description || '').length,
            metaData_keys: Object.keys(item.metaData || {}),
            images: item.metaData?.images?.slice(0, 3),
            images_count: item.metaData?.images?.length || 0,
            cover_image: item.metaData?.coverImage,
            video: item.metaData?.video,
            address: item.address,
            additionalDetails: item.additionalDetails,
            customer: item.customer,
            adType: item.adType,
            tags: item.tags,
          };
        } else {
          out.queries_keys = queries.slice(0, 5).map((q: any) => JSON.stringify(q.queryKey));
        }
      } else {
        // Listing page
        const feed = queries.find((q: any) => 
          q.state?.data?.private !== undefined || 
          q.state?.data?.commercial !== undefined ||
          q.state?.data?.platinum !== undefined
        );
        if (feed) {
          const d = feed.state.data;
          out.feed = {
            private_count: d.private?.length || 0,
            commercial_count: d.commercial?.length || 0,
            platinum_count: d.platinum?.length || 0,
          };
        }
      }
    } catch (e) {
      out.parse_error = (e as Error).message;
    }
  }

  return new Response(JSON.stringify(out, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
