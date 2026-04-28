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
    html_preview: html.slice(0, 500),
    has_next_data: html.includes('__NEXT_DATA__'),
    has_property_links: /\/realestate\/item\/[a-z0-9]+/i.test(html),
    is_blocked_403: html.includes('Radware') || html.includes('Captcha') || /access\s*denied/i.test(html),
  };

  // Try parsing __NEXT_DATA__
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (m) {
    try {
      const data = JSON.parse(m[1]);
      const queries = data?.props?.pageProps?.dehydratedState?.queries || [];
      const feed = queries.find((q: any) => 
        q.state?.data?.private !== undefined || 
        q.state?.data?.commercial !== undefined ||
        q.state?.data?.platinum !== undefined
      );
      if (feed) {
        const d = feed.state.data;
        const sample = d.private?.[0] || d.commercial?.[0] || d.platinum?.[0];
        out.feed = {
          private_count: d.private?.length || 0,
          commercial_count: d.commercial?.length || 0,
          platinum_count: d.platinum?.length || 0,
          sample_keys: sample ? Object.keys(sample) : [],
          sample: sample ? {
            token: sample.token,
            price: sample.price,
            rooms: sample.additionalDetails?.roomsCount,
            size: sample.additionalDetails?.squareMeter,
            floor: sample.address?.house?.floor,
            city: sample.address?.city?.text,
            neighborhood: sample.address?.neighborhood?.text,
            street: sample.address?.street?.text,
            houseNumber: sample.address?.house?.number,
            agencyName: sample.customer?.agencyName,
            isAgency: sample.customer?.isAgency,
            adType: sample.adType,
          } : null,
        };
      } else {
        out.queries_keys = queries.slice(0, 10).map((q: any) => ({
          key: JSON.stringify(q.queryKey).slice(0, 100),
          data_keys: q.state?.data ? Object.keys(q.state.data).slice(0, 10) : [],
        }));
      }
    } catch (e) {
      out.parse_error = (e as Error).message;
    }
  }

  return new Response(JSON.stringify(out, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
