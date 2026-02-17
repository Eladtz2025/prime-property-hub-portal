import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { isListingRemoved, isMadlanHomepage } from "../_shared/availability-indicators.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Fetch ~5 active properties from different sources
  const { data: properties, error } = await supabase
    .from('scouted_properties')
    .select('id, source_url, source, title, address')
    .eq('is_active', true)
    .not('source_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Pick up to 2 per source for variety
  // Pick 1 per source, max 3 total
  const picked: typeof properties = [];
  const seenSources = new Set<string>();
  for (const p of properties || []) {
    const src = p.source || 'unknown';
    if (!seenSources.has(src)) {
      picked.push(p);
      seenSources.add(src);
    }
    if (picked.length >= 3) break;
  }

  const results: any[] = [];

  // Sequential to respect rate limits
  for (const prop of picked) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const jinaUrl = `https://r.jina.ai/${prop.source_url}`;
      const response = await fetch(jinaUrl, {
        headers: {
          'Accept': 'text/markdown',
          'X-Return-Format': 'markdown',
          'X-Locale': 'he-IL',
          'X-Timeout': '15',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const content = await response.text();
      const elapsed = Date.now() - start;

      let detection_result = 'content_ok';
      if (!content || content.length < 100) {
        detection_result = 'short_or_empty';
      } else if (isListingRemoved(content)) {
        detection_result = 'listing_removed_indicator';
      } else if (prop.source === 'madlan' && isMadlanHomepage(content)) {
        detection_result = 'madlan_homepage_redirect';
      }

      results.push({
        id: prop.id,
        source: prop.source,
        title: prop.title || prop.address,
        source_url: prop.source_url,
        jina_status: response.status,
        content_length: content.length,
        elapsed_ms: elapsed,
        detection_result,
        content_preview: content.substring(0, 500),
      });
    } catch (err) {
      results.push({
        id: prop.id,
        source: prop.source,
        title: prop.title || prop.address,
        source_url: prop.source_url,
        jina_status: 0,
        content_length: 0,
        elapsed_ms: Date.now() - start,
        detection_result: 'fetch_error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return new Response(JSON.stringify({ total: results.length, results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
