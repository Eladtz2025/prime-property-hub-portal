import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { isListingRemoved, isMadlanHomepage } from "../_shared/availability-indicators.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Different strategies to try for Yad2
const STRATEGIES = [
  {
    name: 'jina_default',
    getUrl: (url: string) => `https://r.jina.ai/${url}`,
    headers: {
      'Accept': 'text/markdown',
      'X-Return-Format': 'markdown',
      'X-Locale': 'he-IL',
      'X-Timeout': '15',
    },
  },
  {
    name: 'jina_no_cache_raw',
    getUrl: (url: string) => `https://r.jina.ai/${url}`,
    headers: {
      'Accept': 'text/markdown',
      'X-Return-Format': 'markdown',
      'X-Locale': 'he-IL',
      'X-Timeout': '20',
      'X-No-Cache': 'true',
      'X-Respond-With': 'markdown',
    },
  },
  {
    name: 'jina_google_cache',
    getUrl: (url: string) => `https://r.jina.ai/https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`,
    headers: {
      'Accept': 'text/markdown',
      'X-Return-Format': 'markdown',
      'X-Timeout': '15',
    },
  },
];

function detectResult(content: string, source: string): string {
  if (!content || content.length < 100) return 'short_or_empty';
  if (isListingRemoved(content)) return 'listing_removed_indicator';
  if (source === 'madlan' && isMadlanHomepage(content)) return 'madlan_homepage_redirect';
  
  // Detect CAPTCHA/bot block
  const lower = content.toLowerCase();
  if (lower.includes('captcha') || lower.includes('are you for real') || 
      lower.includes('additional verification') || lower.includes('bot manager')) {
    return 'blocked_captcha';
  }
  
  return 'content_ok';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Parse optional body for specific property IDs or strategy
  let targetIds: string[] = [];
  let strategyFilter: string | null = null;
  try {
    const body = await req.json();
    if (body.property_ids) targetIds = body.property_ids;
    if (body.strategy) strategyFilter = body.strategy;
  } catch { /* no body */ }

  let properties: any[];

  if (targetIds.length > 0) {
    const { data, error } = await supabase
      .from('scouted_properties')
      .select('id, source_url, source, title, address')
      .in('id', targetIds);
    if (error) return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    properties = data || [];
  } else {
    // Pick 1 yad2 property to test strategies on
    const { data, error } = await supabase
      .from('scouted_properties')
      .select('id, source_url, source, title, address')
      .eq('is_active', true)
      .eq('source', 'yad2')
      .not('source_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    properties = data || [];
  }

  const strategies = strategyFilter 
    ? STRATEGIES.filter(s => s.name === strategyFilter) 
    : STRATEGIES;

  const results: any[] = [];

  for (const prop of properties) {
    for (const strategy of strategies) {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const fetchUrl = strategy.getUrl(prop.source_url);
        console.log(`🔍 [${strategy.name}] Fetching: ${fetchUrl}`);

        const response = await fetch(fetchUrl, {
          headers: strategy.headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const content = await response.text();
        const elapsed = Date.now() - start;
        const detection = detectResult(content, prop.source);

        console.log(`📊 [${strategy.name}] Status=${response.status}, Length=${content.length}, Detection=${detection}, Time=${elapsed}ms`);

        results.push({
          id: prop.id,
          source: prop.source,
          title: prop.title || prop.address,
          strategy: strategy.name,
          jina_status: response.status,
          content_length: content.length,
          elapsed_ms: elapsed,
          detection_result: detection,
          content_preview: content.substring(0, 400),
        });
      } catch (err) {
        results.push({
          id: prop.id,
          source: prop.source,
          title: prop.title || prop.address,
          strategy: strategy.name,
          jina_status: 0,
          content_length: 0,
          elapsed_ms: Date.now() - start,
          detection_result: 'fetch_error',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return new Response(JSON.stringify({ total: results.length, results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
