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
  const count = Math.min(body.count || 5, 8);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get active Madlan properties  
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

  const results: any[] = [];
  let ok = 0, fail = 0;

  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 8000);

      // The magic combo: Accept JSON + X-Nextjs-Data header
      const r = await fetch(p.source_url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Nextjs-Data': '1',
          'Accept-Language': 'he-IL,he;q=0.9',
        },
        signal: c.signal,
      });
      clearTimeout(t);
      const txt = await r.text();
      const isBlock = r.status === 403 || txt.includes('סליחה על ההפרעה');
      
      if (r.status === 200 && !isBlock) ok++; else fail++;
      
      // Check what kind of content we got
      let contentType = 'unknown';
      try {
        JSON.parse(txt.substring(0, 100));
        contentType = 'json';
      } catch {
        if (txt.startsWith('<!DOCTYPE') || txt.startsWith('<html')) contentType = 'html';
      }

      results.push({
        i: i+1, 
        addr: (p.address || '?').substring(0, 30),
        status: r.status, 
        len: txt.length, 
        isBlock,
        contentType,
        hasRemoval: txt.includes('המודעה הוסרה'),
        hasPrice: txt.includes('₪') || txt.includes('price'),
        snippet: txt.substring(0, 150),
      });
    } catch (e) {
      fail++;
      results.push({ i: i+1, addr: (p.address || '?').substring(0, 30), error: String(e).substring(0, 80) });
    }
    if (i < properties.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  return new Response(JSON.stringify({ strategy: 'nextjs-data', ok, fail, total: results.length, results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
