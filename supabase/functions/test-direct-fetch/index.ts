import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { analyzeMadlanHtml, analyzeMadlanBrokerDetection } from "./analyze.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * TEST ONLY - Direct Fetch Diagnostic v2
 * Tests multiple fetch strategies against Madlan
 * Does NOT save anything to DB.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const page = body.page ?? 1;
  const city = body.city ?? 'תל-אביב-יפו-ישראל';
  const dealType = body.deal_type ?? 'for-rent';
  const mode = body.mode ?? 'analyze'; // 'analyze', 'broker-audit', or 'strategies'

  const baseUrl = `https://www.madlan.co.il/${dealType}/${encodeURIComponent(city)}?page=${page}`;

  if (mode === 'broker-audit') {
    // Broker detection diagnostic - detailed per-card analysis
    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' },
    });
    const html = await response.text();
    const audit = analyzeMadlanBrokerDetection(html);
    
    return new Response(JSON.stringify({ url: baseUrl, page, html_length: html.length, audit }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (mode === 'analyze') {
    // Direct fetch with minimal headers and analyze structure
    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: { 'Accept': '*/*' },
    });
    const html = await response.text();
    const analysis = analyzeMadlanHtml(html);
    
    return new Response(JSON.stringify({ url: baseUrl, page, analysis }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Original strategy testing mode
  const STRATEGIES: Record<string, Record<string, string>> = {
    minimal: { 'Accept': 'text/html' },
    naked: {},
    deno_default: { 'Accept': '*/*' },
  };

  const strategy = body.strategy as string | undefined;
  const strategiesToTest = strategy && strategy !== 'all' 
    ? { [strategy]: (STRATEGIES as any)[strategy] || {} }
    : STRATEGIES;

  const results: Record<string, any> = {};

  for (const [name, headers] of Object.entries(strategiesToTest)) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: headers as Record<string, string>,
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeoutId);
      const html = await response.text();
      const duration = Date.now() - startTime;
      const uniqueListings = new Set(html.match(/\/listings\/[A-Za-z0-9]+/g) || []);

      results[name] = {
        status: response.status,
        html_length: html.length,
        duration_ms: duration,
        unique_listings: uniqueListings.size,
        has_content: html.length > 50000,
      };
    } catch (error) {
      results[name] = {
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown',
        duration_ms: Date.now() - startTime,
      };
    }

    if (Object.keys(strategiesToTest).length > 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return new Response(JSON.stringify({ url: baseUrl, page, results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
