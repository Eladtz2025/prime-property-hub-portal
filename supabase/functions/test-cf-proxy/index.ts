import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const CF_WORKER_URL = 'https://yad2-proxy.taylor-kelly88.workers.dev/';
  const proxyKey = Deno.env.get('YAD2_PROXY_KEY');

  if (!proxyKey) {
    return new Response(JSON.stringify({ error: 'YAD2_PROXY_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const testUrl = 'https://www.yad2.co.il/realestate/rent?city=5000&propertyGroup=apartments&page=1';

  try {
    console.log(`🧪 Testing CF Worker with URL: ${testUrl}`);
    const start = Date.now();

    const response = await fetch(CF_WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-proxy-key': proxyKey,
      },
      body: JSON.stringify({ url: testUrl }),
    });

    const elapsed = Date.now() - start;
    const data = await response.json();

    const html = data.html || '';
    const hasNextData = html.includes('__NEXT_DATA__');
    const hasProperties = html.includes('realestate/item') || html.includes('feeditem');
    const is403 = data.status === 403;

    console.log(`🧪 CF Worker response: status=${data.status}, html_length=${html.length}, hasNextData=${hasNextData}, hasProperties=${hasProperties}, elapsed=${elapsed}ms`);

    return new Response(JSON.stringify({
      cf_worker_status: response.status,
      upstream_status: data.status,
      html_length: html.length,
      has_next_data: hasNextData,
      has_property_links: hasProperties,
      is_blocked_403: is403,
      elapsed_ms: elapsed,
      html_preview: html.substring(0, 500),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
