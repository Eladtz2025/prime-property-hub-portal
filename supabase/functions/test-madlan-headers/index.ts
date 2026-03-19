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
  const JINA_API_KEY = Deno.env.get('JINA_API_KEY');
  const results: Record<string, any> = {};

  // Test 1: Jina WITH API key (premium IPs)
  if (JINA_API_KEY) {
    try {
      const c1 = new AbortController();
      const t1 = setTimeout(() => c1.abort(), 25000);
      const r1 = await fetch(`https://r.jina.ai/${testUrl}`, {
        headers: {
          'Authorization': `Bearer ${JINA_API_KEY}`,
          'Accept': 'text/markdown',
          'X-Wait-For-Selector': 'body',
          'X-Timeout': '20',
          'X-Locale': 'he-IL',
          'X-No-Cache': 'true',
        },
        signal: c1.signal,
      });
      clearTimeout(t1);
      const body1 = await r1.text();
      const hasRobotText = body1.includes('רובוט') || body1.includes('סליחה על ההפרעה');
      const hasListingData = body1.includes('חדרים') || body1.includes('קומה') || body1.includes('מ"ר') || body1.includes('₪');
      results['test1_jina_with_key'] = { 
        status: r1.status, 
        bodyLength: body1.length,
        hasRobotText,
        hasListingData,
        snippet: body1.substring(0, 600),
      };
    } catch (e) {
      results['test1_jina_with_key'] = { error: String(e) };
    }
  } else {
    results['test1_jina_with_key'] = { error: 'No JINA_API_KEY set' };
  }

  // Test 2: Jina WITH API key + X-Return-Format html
  if (JINA_API_KEY) {
    try {
      const c2 = new AbortController();
      const t2 = setTimeout(() => c2.abort(), 25000);
      const r2 = await fetch(`https://r.jina.ai/${testUrl}`, {
        headers: {
          'Authorization': `Bearer ${JINA_API_KEY}`,
          'Accept': 'text/html',
          'X-Wait-For-Selector': 'body',
          'X-Timeout': '20',
          'X-Locale': 'he-IL',
          'X-No-Cache': 'true',
        },
        signal: c2.signal,
      });
      clearTimeout(t2);
      const body2 = await r2.text();
      const hasRemoved = body2.includes('המודעה הוסרה');
      const hasPrice = body2.includes('₪') || body2.includes('price');
      results['test2_jina_html_with_key'] = { 
        status: r2.status, 
        bodyLength: body2.length,
        hasRemoved,
        hasPrice,
      };
    } catch (e) {
      results['test2_jina_html_with_key'] = { error: String(e) };
    }
  }

  // Test 3: Try a second URL to rule out per-listing issues
  if (JINA_API_KEY) {
    const testUrl2 = 'https://www.madlan.co.il/listings/30FdJVMdXke';
    try {
      const c3 = new AbortController();
      const t3 = setTimeout(() => c3.abort(), 25000);
      const r3 = await fetch(`https://r.jina.ai/${testUrl2}`, {
        headers: {
          'Authorization': `Bearer ${JINA_API_KEY}`,
          'Accept': 'text/markdown',
          'X-Wait-For-Selector': 'body',
          'X-Timeout': '20',
          'X-Locale': 'he-IL',
          'X-No-Cache': 'true',
        },
        signal: c3.signal,
      });
      clearTimeout(t3);
      const body3 = await r3.text();
      const hasRobotText = body3.includes('רובוט') || body3.includes('סליחה על ההפרעה');
      const hasListingData = body3.includes('חדרים') || body3.includes('קומה') || body3.includes('מ"ר') || body3.includes('₪');
      results['test3_jina_second_url'] = { 
        status: r3.status, 
        bodyLength: body3.length,
        hasRobotText,
        hasListingData,
        snippet: body3.substring(0, 600),
      };
    } catch (e) {
      results['test3_jina_second_url'] = { error: String(e) };
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
