import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Large-scale Madlan test: fetch 15 active property URLs with GET
 * to measure current block rate. Tests different header strategies.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get 15 active Madlan properties
  const { data: properties } = await supabase
    .from('scouted_properties')
    .select('source_url, address')
    .eq('source', 'madlan')
    .eq('is_active', true)
    .not('source_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(15);

  if (!properties?.length) {
    return new Response(JSON.stringify({ error: 'No madlan properties found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const results: any[] = [];
  let success = 0;
  let blocked = 0;

  // Strategy 1: No headers (current approach) - test 5 URLs
  for (let i = 0; i < Math.min(5, properties.length); i++) {
    const p = properties[i];
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 10000);
      const r = await fetch(p.source_url, { 
        method: 'GET', 
        headers: { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' },
        signal: c.signal 
      });
      clearTimeout(t);
      const body = await r.text();
      const hasListings = body.includes('data-auto-bulletin-id');
      const isBlock = r.status === 403 || body.includes('סליחה על ההפרעה');
      if (r.status === 200 && !isBlock) success++; else blocked++;
      results.push({
        strategy: 'no-ua',
        i: i + 1,
        addr: (p.address || '?').substring(0, 25),
        status: r.status,
        len: body.length,
        hasListings,
        isBlock,
      });
    } catch (e) {
      blocked++;
      results.push({ strategy: 'no-ua', i: i + 1, error: String(e).substring(0, 60) });
    }
    if (i < 4) await new Promise(r => setTimeout(r, 2000));
  }

  // Strategy 2: With User-Agent - test 5 URLs
  for (let i = 5; i < Math.min(10, properties.length); i++) {
    const p = properties[i];
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 10000);
      const r = await fetch(p.source_url, { 
        method: 'GET', 
        headers: { 
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Cache-Control': 'no-cache',
        },
        signal: c.signal 
      });
      clearTimeout(t);
      const body = await r.text();
      const hasListings = body.includes('data-auto-bulletin-id');
      const isBlock = r.status === 403 || body.includes('סליחה על ההפרעה');
      if (r.status === 200 && !isBlock) success++; else blocked++;
      results.push({
        strategy: 'with-ua',
        i: i + 1 - 5,
        addr: (p.address || '?').substring(0, 25),
        status: r.status,
        len: body.length,
        hasListings,
        isBlock,
      });
    } catch (e) {
      blocked++;
      results.push({ strategy: 'with-ua', i: i + 1 - 5, error: String(e).substring(0, 60) });
    }
    if (i < 9) await new Promise(r => setTimeout(r, 2000));
  }

  // Strategy 3: With longer delay (5s) between requests - test 5 URLs
  for (let i = 10; i < Math.min(15, properties.length); i++) {
    const p = properties[i];
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 10000);
      const r = await fetch(p.source_url, { 
        method: 'GET', 
        headers: { 'Accept': '*/*' },
        signal: c.signal 
      });
      clearTimeout(t);
      const body = await r.text();
      const hasListings = body.includes('data-auto-bulletin-id');
      const isBlock = r.status === 403 || body.includes('סליחה על ההפרעה');
      if (r.status === 200 && !isBlock) success++; else blocked++;
      results.push({
        strategy: 'slow-5s',
        i: i + 1 - 10,
        addr: (p.address || '?').substring(0, 25),
        status: r.status,
        len: body.length,
        hasListings,
        isBlock,
      });
    } catch (e) {
      blocked++;
      results.push({ strategy: 'slow-5s', i: i + 1 - 10, error: String(e).substring(0, 60) });
    }
    if (i < 14) await new Promise(r => setTimeout(r, 5000));
  }

  return new Response(JSON.stringify({ 
    summary: { total: results.length, success, blocked },
    results 
  }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
