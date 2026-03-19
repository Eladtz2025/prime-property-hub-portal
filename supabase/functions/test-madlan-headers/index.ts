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

  // Get 3 removed and 3 active, interleaved
  const { data: removed } = await supabase
    .from('scouted_properties')
    .select('source_url, address, availability_check_reason')
    .eq('source', 'madlan').eq('is_active', false)
    .in('availability_check_reason', ['listing_removed_410', 'listing_removed_small_html_og_homepage'])
    .not('source_url', 'is', null)
    .order('availability_checked_at', { ascending: false })
    .limit(3);

  const { data: active } = await supabase
    .from('scouted_properties')
    .select('source_url, address')
    .eq('source', 'madlan').eq('is_active', true)
    .not('source_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3);

  // Interleave: removed, active, removed, active...
  const tests: { url: string; addr: string; expected: string }[] = [];
  for (let i = 0; i < 3; i++) {
    if (removed?.[i]) tests.push({ url: removed[i].source_url, addr: removed[i].address || '?', expected: 'removed' });
    if (active?.[i]) tests.push({ url: active[i].source_url, addr: active[i].address || '?', expected: 'active' });
  }

  const results: any[] = [];
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    try {
      const c = new AbortController();
      const tid = setTimeout(() => c.abort(), 10000);
      const r = await fetch(t.url, { method: 'HEAD', signal: c.signal });
      clearTimeout(tid);
      results.push({
        i: i + 1,
        expected: t.expected,
        addr: t.addr.substring(0, 25),
        HEAD_status: r.status,
        match: (t.expected === 'active' && r.status === 200) || (t.expected === 'removed' && r.status !== 200) ? '✅' : '❓',
      });
    } catch (e) {
      results.push({ i: i + 1, expected: t.expected, addr: t.addr.substring(0, 25), error: String(e).substring(0, 60) });
    }
    // Small delay
    if (i < tests.length - 1) await sleep(2000);
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
