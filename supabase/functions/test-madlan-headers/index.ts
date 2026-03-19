import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const testUrl = 'https://www.madlan.co.il/listings/ds0nyz2Jy7f';
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
  const results: Record<string, any> = {};

  // Test 1: Firecrawl scrape
  if (FIRECRAWL_API_KEY) {
    try {
      const c1 = new AbortController();
      const t1 = setTimeout(() => c1.abort(), 30000);
      const r1 = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: testUrl,
          formats: ['markdown'],
          waitFor: 3000,
        }),
        signal: c1.signal,
      });
      clearTimeout(t1);
      const body1 = await r1.json();
      const md = body1?.data?.markdown || '';
      results['test1_firecrawl'] = { 
        status: r1.status,
        success: body1?.success,
        markdownLength: md.length,
        hasRobotText: md.includes('רובוט') || md.includes('סליחה על ההפרעה'),
        hasListingData: md.includes('חדרים') || md.includes('קומה') || md.includes('מ"ר') || md.includes('₪'),
        snippet: md.substring(0, 600),
      };
    } catch (e) {
      results['test1_firecrawl'] = { error: String(e) };
    }
  } else {
    results['test1_firecrawl'] = { error: 'No FIRECRAWL_API_KEY' };
  }

  // Test 2: Jina free tier - try with X-Set-Cookie header to pass challenge
  try {
    const c2 = new AbortController();
    const t2 = setTimeout(() => c2.abort(), 25000);
    const r2 = await fetch(`https://r.jina.ai/${testUrl}`, {
      headers: {
        'Accept': 'text/markdown',
        'X-Wait-For-Selector': 'body',
        'X-Timeout': '20',
        'X-Locale': 'he-IL',
        'X-No-Cache': 'true',
        'X-With-Generated-Alt': 'false',
        'X-With-Links-Summary': 'false',
        'X-With-Images': 'false',
      },
      signal: c2.signal,
    });
    clearTimeout(t2);
    const body2 = await r2.text();
    results['test2_jina_free_optimized'] = { 
      status: r2.status, 
      bodyLength: body2.length,
      hasRobotText: body2.includes('רובוט'),
      hasListingData: body2.includes('חדרים') || body2.includes('₪'),
      snippet: body2.substring(0, 400),
    };
  } catch (e) {
    results['test2_jina_free_optimized'] = { error: String(e) };
  }

  // Test 3: Try Google Webcache
  try {
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(testUrl)}`;
    const c3 = new AbortController();
    const t3 = setTimeout(() => c3.abort(), 15000);
    const r3 = await fetch(cacheUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      signal: c3.signal,
    });
    clearTimeout(t3);
    const body3 = await r3.text();
    results['test3_google_cache'] = { 
      status: r3.status, 
      bodyLength: body3.length,
    };
  } catch (e) {
    results['test3_google_cache'] = { error: String(e) };
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
