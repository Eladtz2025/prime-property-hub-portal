import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { isListingRemoved, isMadlanHomepage } from "../_shared/availability-indicators.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 4 separate strategies to test against Yad2
const STRATEGIES = [
  {
    name: 'jina_default',
    description: 'Jina basic - no API key, default headers',
    getUrl: (url: string) => `https://r.jina.ai/${url}`,
    headers: (apiKey?: string) => ({
      'Accept': 'text/markdown',
      'X-Return-Format': 'markdown',
      'X-Locale': 'he-IL',
      'X-Timeout': '15',
    }),
  },
  {
    name: 'jina_off_hours',
    description: 'Jina with no-cache + wait + longer timeout (simulates off-hours patience)',
    getUrl: (url: string) => `https://r.jina.ai/${url}`,
    headers: (apiKey?: string) => ({
      'Accept': 'text/markdown',
      'X-Return-Format': 'markdown',
      'X-Locale': 'he-IL',
      'X-Timeout': '30',
      'X-No-Cache': 'true',
      'X-Wait-For-Selector': 'body',
    }),
  },
  {
    name: 'jina_google_cache',
    description: 'Jina via Google Cache URL',
    getUrl: (url: string) => `https://r.jina.ai/https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`,
    headers: (apiKey?: string) => ({
      'Accept': 'text/markdown',
      'X-Return-Format': 'markdown',
      'X-Timeout': '15',
    }),
  },
  {
    name: 'jina_with_api_key',
    description: 'Jina with API key (premium proxies)',
    getUrl: (url: string) => `https://r.jina.ai/${url}`,
    headers: (apiKey?: string) => ({
      'Accept': 'text/markdown',
      'X-Return-Format': 'markdown',
      'X-Locale': 'he-IL',
      'X-Timeout': '20',
      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
    }),
  },
];

function detectResult(content: string, source: string): string {
  if (!content || content.length < 100) return 'short_or_empty';
  if (isListingRemoved(content)) return 'listing_removed_indicator';
  if (source === 'madlan' && isMadlanHomepage(content)) return 'madlan_homepage_redirect';
  
  const lower = content.toLowerCase();
  if (lower.includes('captcha') || lower.includes('are you for real') || 
      lower.includes('additional verification') || lower.includes('bot manager') ||
      lower.includes('radware')) {
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

  const jinaApiKey = Deno.env.get('JINA_API_KEY') || '';

  // Parse body: strategy (required) = which single strategy to test
  let strategyName: string | null = null;
  let targetIds: string[] = [];
  try {
    const body = await req.json();
    strategyName = body.strategy || null;
    if (body.property_ids) targetIds = body.property_ids;
  } catch { /* no body */ }

  if (!strategyName) {
    return new Response(JSON.stringify({
      error: 'Must specify strategy',
      available: STRATEGIES.map(s => ({ name: s.name, description: s.description }))
    }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const strategy = STRATEGIES.find(s => s.name === strategyName);
  if (!strategy) {
    return new Response(JSON.stringify({
      error: `Unknown strategy: ${strategyName}`,
      available: STRATEGIES.map(s => s.name)
    }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get 1 Yad2 property to test
  let properties: any[];
  if (targetIds.length > 0) {
    const { data } = await supabase
      .from('scouted_properties')
      .select('id, source_url, source, title, address')
      .in('id', targetIds);
    properties = data || [];
  } else {
    const { data } = await supabase
      .from('scouted_properties')
      .select('id, source_url, source, title, address')
      .eq('is_active', true)
      .eq('source', 'yad2')
      .not('source_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);
    properties = data || [];
  }

  if (properties.length === 0) {
    return new Response(JSON.stringify({ error: 'No properties found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const prop = properties[0];
  const start = Date.now();

  console.log(`\n🧪 EXPERIMENT: ${strategy.name}`);
  console.log(`📝 ${strategy.description}`);
  console.log(`🏠 Property: ${prop.title || prop.address} (${prop.source})`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    const fetchUrl = strategy.getUrl(prop.source_url);
    const headers = strategy.headers(jinaApiKey);

    console.log(`🔗 URL: ${fetchUrl}`);
    console.log(`📋 Headers: ${JSON.stringify(headers)}`);

    const response = await fetch(fetchUrl, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const content = await response.text();
    const elapsed = Date.now() - start;
    const detection = detectResult(content, prop.source);

    console.log(`\n📊 RESULT:`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Content length: ${content.length}`);
    console.log(`   Detection: ${detection}`);
    console.log(`   Time: ${elapsed}ms`);
    console.log(`   Preview: ${content.substring(0, 200)}`);

    return new Response(JSON.stringify({
      experiment: strategy.name,
      description: strategy.description,
      property: {
        id: prop.id,
        source: prop.source,
        title: prop.title || prop.address,
        source_url: prop.source_url,
      },
      result: {
        jina_status: response.status,
        content_length: content.length,
        elapsed_ms: elapsed,
        detection: detection,
        success: detection === 'content_ok',
        content_preview: content.substring(0, 500),
      }
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    const elapsed = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`❌ FAILED: ${errorMsg} (${elapsed}ms)`);

    return new Response(JSON.stringify({
      experiment: strategy.name,
      description: strategy.description,
      property: {
        id: prop.id,
        source: prop.source,
        title: prop.title || prop.address,
      },
      result: {
        jina_status: 0,
        content_length: 0,
        elapsed_ms: elapsed,
        detection: 'fetch_error',
        success: false,
        error: errorMsg,
      }
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
