import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchMadlanNextjs(url: string): Promise<{ status: number; len: number; isBlock: boolean; hasPrice: boolean; hasRemoval: boolean; ogHomepage: boolean } | { error: string }> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 8000);
    const r = await fetch(url, {
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
    const ogUrl = txt.match(/<meta[^>]*property="og:url"[^>]*content="([^"]*)"[^>]*>/)?.[1] || '';
    return {
      status: r.status,
      len: txt.length,
      isBlock: r.status === 403 || txt.includes('סליחה על ההפרעה'),
      hasPrice: txt.includes('₪'),
      hasRemoval: txt.includes('המודעה הוסרה') || txt.includes('המודעה המבוקשת כבר אינה מפורסמת'),
      ogHomepage: ogUrl === 'https://www.madlan.co.il' || ogUrl === 'https://www.madlan.co.il/',
    };
  } catch (e) {
    return { error: String(e).substring(0, 80) };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const testType = body.type || 'active'; // 'active', 'removed', 'mixed'

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let urls: { url: string; addr: string; expected: string }[] = [];

  if (testType === 'active' || testType === 'mixed') {
    const { data } = await supabase
      .from('scouted_properties')
      .select('source_url, address')
      .eq('source', 'madlan').eq('is_active', true)
      .not('source_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(testType === 'mixed' ? 4 : 4);
    if (data) urls.push(...data.map(d => ({ url: d.source_url, addr: d.address || '?', expected: 'active' })));
  }

  if (testType === 'removed' || testType === 'mixed') {
    const { data } = await supabase
      .from('scouted_properties')
      .select('source_url, address')
      .eq('source', 'madlan').eq('is_active', false)
      .in('availability_check_reason', ['listing_removed_410', 'listing_removed_small_html_og_homepage', 'listing_removed_og_description'])
      .not('source_url', 'is', null)
      .order('availability_checked_at', { ascending: false })
      .limit(testType === 'mixed' ? 4 : 4);
    if (data) urls.push(...data.map(d => ({ url: d.source_url, addr: d.address || '?', expected: 'removed' })));
  }

  const results: any[] = [];
  let correctDetections = 0;

  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    const r = await fetchMadlanNextjs(u.url);
    
    let detection = 'unknown';
    if ('error' in r) {
      detection = 'error';
    } else if (r.status === 404 || r.status === 410) {
      detection = 'removed';
    } else if (r.hasRemoval) {
      detection = 'removed';
    } else if (r.ogHomepage && r.len < 200000) {
      detection = 'removed';
    } else if (r.status === 200 && !r.isBlock && r.hasPrice) {
      detection = 'active';
    } else if (r.status === 200 && !r.isBlock) {
      detection = 'probably_active';
    } else if (r.isBlock) {
      detection = 'blocked';
    }

    const correct = detection === u.expected || (detection === 'probably_active' && u.expected === 'active');
    if (correct) correctDetections++;

    results.push({
      i: i + 1,
      addr: u.addr.substring(0, 25),
      expected: u.expected,
      detection,
      correct: correct ? '✅' : '❌',
      ...('error' in r ? { error: r.error } : { status: r.status, len: r.len, isBlock: r.isBlock, hasRemoval: r.hasRemoval, ogHomepage: r.ogHomepage }),
    });

    if (i < urls.length - 1) await new Promise(r => setTimeout(r, 1000));
  }

  return new Response(JSON.stringify({
    testType,
    total: results.length,
    correct: correctDetections,
    accuracy: `${Math.round(correctDetections / results.length * 100)}%`,
    results,
  }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
