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

  // Get 10 different madlan URLs to test
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
    .limit(10);

  if (!properties || properties.length === 0) {
    return new Response(JSON.stringify({ error: 'No madlan properties found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results: any[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      
      const response = await fetch(prop.source_url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'he-IL,he;q=0.9',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const html = await response.text();
      const elapsed = Date.now() - startTime;

      if (response.status === 200) {
        successCount++;
        const hasContent = html.length > 200000;
        results.push({
          index: i + 1,
          address: prop.address || prop.title,
          status: response.status,
          bodyLength: html.length,
          hasFullContent: hasContent,
          elapsed: `${elapsed}ms`,
          result: '✅ OK',
        });
      } else {
        failCount++;
        results.push({
          index: i + 1,
          address: prop.address || prop.title,
          status: response.status,
          bodyLength: html.length,
          elapsed: `${elapsed}ms`,
          result: `❌ ${response.status}`,
        });

        // If we got 403, try retry after 10 seconds
        if (response.status === 403 && i < 3) {
          console.log(`🔄 Got 403 on property ${i+1}, waiting 15s and retrying...`);
          await sleep(15000);
          
          try {
            const retryController = new AbortController();
            const retryTimeout = setTimeout(() => retryController.abort(), 25000);
            const retryStart = Date.now();
            
            const retryResponse = await fetch(prop.source_url, {
              method: 'GET',
              headers: {
                'Accept': '*/*',
                'Accept-Language': 'he-IL,he;q=0.9',
              },
              signal: retryController.signal,
            });
            clearTimeout(retryTimeout);
            
            const retryHtml = await retryResponse.text();
            const retryElapsed = Date.now() - retryStart;
            
            results.push({
              index: `${i + 1}-RETRY`,
              address: prop.address || prop.title,
              status: retryResponse.status,
              bodyLength: retryHtml.length,
              elapsed: `${retryElapsed}ms (after 15s wait)`,
              result: retryResponse.status === 200 ? '✅ RETRY OK' : `❌ RETRY ${retryResponse.status}`,
            });
            
            if (retryResponse.status === 200) {
              successCount++;
              failCount--;
            }
          } catch (retryErr) {
            results.push({
              index: `${i + 1}-RETRY`,
              address: prop.address || prop.title,
              result: `❌ RETRY ERROR: ${retryErr}`,
            });
          }
        }
      }
    } catch (e) {
      failCount++;
      results.push({
        index: i + 1,
        address: prop.address || prop.title,
        result: `❌ ERROR: ${String(e).substring(0, 100)}`,
        elapsed: `${Date.now() - startTime}ms`,
      });
    }

    // Wait 8 seconds between requests (the proposed delay)
    if (i < properties.length - 1) {
      console.log(`⏳ Waiting 8s before next request (${i+2}/${properties.length})...`);
      await sleep(8000);
    }
  }

  const summary = {
    totalTested: properties.length,
    success: successCount,
    failed: failCount,
    successRate: `${Math.round((successCount / properties.length) * 100)}%`,
    delayBetweenRequests: '8 seconds',
    retryDelayOn403: '15 seconds (tested on first 3 failures)',
    results,
  };

  return new Response(JSON.stringify(summary, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
