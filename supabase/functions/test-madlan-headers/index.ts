import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.1");
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const results: Record<string, any> = {};

  // Test 1: HEAD on known-active listings (5 different)
  const { data: activeProps } = await supabase
    .from('scouted_properties')
    .select('id, source_url, address')
    .eq('source', 'madlan')
    .eq('is_active', true)
    .not('source_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5);

  const activeResults: any[] = [];
  for (const p of (activeProps || [])) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 10000);
      const r = await fetch(p.source_url, { method: 'HEAD', signal: c.signal });
      clearTimeout(t);
      activeResults.push({ 
        addr: (p.address || '').substring(0, 25), 
        status: r.status,
        contentType: r.headers.get('content-type'),
        location: r.headers.get('location'),
      });
    } catch (e) {
      activeResults.push({ addr: (p.address || '').substring(0, 25), error: String(e).substring(0, 60) });
    }
  }
  results['active_listings_HEAD'] = activeResults;

  // Test 2: HEAD on known-removed listings
  const { data: removedProps } = await supabase
    .from('scouted_properties')
    .select('id, source_url, address, availability_check_reason')
    .eq('source', 'madlan')
    .eq('is_active', false)
    .in('availability_check_reason', ['listing_removed_410', 'listing_removed_indicator', 'listing_removed_small_html_og_homepage', 'listing_removed_og_description'])
    .not('source_url', 'is', null)
    .order('availability_checked_at', { ascending: false })
    .limit(5);

  const removedResults: any[] = [];
  for (const p of (removedProps || [])) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 10000);
      const r = await fetch(p.source_url, { method: 'HEAD', signal: c.signal });
      clearTimeout(t);
      removedResults.push({ 
        addr: (p.address || '').substring(0, 25), 
        reason: p.availability_check_reason,
        status: r.status,
        location: r.headers.get('location'),
      });
    } catch (e) {
      removedResults.push({ addr: (p.address || '').substring(0, 25), error: String(e).substring(0, 60) });
    }
  }
  results['removed_listings_HEAD'] = removedResults;

  // Test 3: GET vs HEAD comparison on same URL
  const compUrl = activeProps?.[0]?.source_url;
  if (compUrl) {
    try {
      const ch = new AbortController();
      const th = setTimeout(() => ch.abort(), 10000);
      const rh = await fetch(compUrl, { method: 'HEAD', signal: ch.signal });
      clearTimeout(th);

      const cg = new AbortController();
      const tg = setTimeout(() => cg.abort(), 10000);
      const rg = await fetch(compUrl, { method: 'GET', headers: { 'Accept': '*/*' }, signal: cg.signal });
      clearTimeout(tg);
      await rg.text();

      results['head_vs_get'] = {
        url: compUrl,
        HEAD_status: rh.status,
        GET_status: rg.status,
      };
    } catch (e) {
      results['head_vs_get'] = { error: String(e) };
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
