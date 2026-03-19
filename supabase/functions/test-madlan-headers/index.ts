import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const strategy = body.strategy || 'no-ua'; // no-ua, with-ua, slow
  const count = Math.min(body.count || 5, 8);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: properties } = await supabase
    .from('scouted_properties')
    .select('source_url, address')
    .eq('source', 'madlan')
    .eq('is_active', true)
    .not('source_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(count);

  if (!properties?.length) {
    return new Response(JSON.stringify({ error: 'No properties' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const headers: Record<string, string> = strategy === 'with-ua' 
    ? {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      }
    : { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' };

  const delay = strategy === 'slow' ? 5000 : 2000;
  const results: any[] = [];
  let ok = 0, fail = 0;

  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 10000);
      const r = await fetch(p.source_url, { method: 'GET', headers, signal: c.signal });
      clearTimeout(t);
      const txt = await r.text();
      const isBlock = r.status === 403 || txt.includes('סליחה על ההפרעה') || txt.includes('captcha');
      if (r.status === 200 && !isBlock) ok++; else fail++;
      results.push({
        i: i+1, addr: (p.address||'?').substring(0,25), 
        status: r.status, len: txt.length, isBlock,
        hasData: txt.includes('data-auto-bulletin-id'),
      });
    } catch (e) {
      fail++;
      results.push({ i: i+1, error: String(e).substring(0,60) });
    }
    if (i < properties.length - 1) await new Promise(r => setTimeout(r, delay));
  }

  return new Response(JSON.stringify({ strategy, ok, fail, total: results.length, results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
