import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.1");
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: properties } = await supabase
    .from('scouted_properties')
    .select('id, source_url, address, title')
    .eq('source', 'madlan')
    .eq('is_active', true)
    .not('source_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!properties || properties.length === 0) {
    return new Response(JSON.stringify({ error: 'No properties' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results: any[] = [];
  let ok = 0, fail = 0;
  const DELAY = 8000;

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    const t0 = Date.now();

    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 20000);
      const r = await fetch(prop.source_url, {
        headers: { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' },
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      const html = await r.text();
      const ms = Date.now() - t0;

      if (r.status === 200) {
        ok++;
        results.push({ i: i+1, addr: (prop.address || '').substring(0, 30), status: 200, len: html.length, ms, v: '✅' });
      } else {
        fail++;
        results.push({ i: i+1, addr: (prop.address || '').substring(0, 30), status: r.status, len: html.length, ms, v: '❌' });
      }
    } catch (e) {
      fail++;
      results.push({ i: i+1, addr: (prop.address || '').substring(0, 30), err: String(e).substring(0, 80), ms: Date.now() - t0, v: '❌' });
    }

    if (i < properties.length - 1) await sleep(DELAY);
  }

  return new Response(JSON.stringify({
    count: properties.length, ok, fail, rate: `${Math.round(ok/properties.length*100)}%`,
    delay: `${DELAY/1000}s`, results,
  }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
