import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Fetch Madlan listing page HTML with iPhone UA, then extract embedded state to find poi IDs.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const path = body.path || 'for-rent/' + encodeURIComponent('תל-אביב-יפו-ישראל');
  const url = `https://www.madlan.co.il/${path}`;

  try {
    // Step 1: Fetch HTML
    const htmlRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9',
      },
    });
    const html = await htmlRes.text();

    if (htmlRes.status !== 200) {
      return new Response(JSON.stringify({ step: 'html', status: htmlRes.status, snippet: html.substring(0, 300) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Search for various ID patterns - we need to find the bulletin/poi IDs in the HTML
    // Madlan uses patterns like bulletin-XXXXX or properties with type identifiers
    
    // Pattern A: __APOLLO_STATE__ or window.__INITIAL_STATE__
    const apolloMatch = html.match(/window\.__APOLLO_STATE__\s*=\s*({[\s\S]*?});/);
    const initialMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/);
    const reduxMatch = html.match(/window\.REDUX_INITIAL_STATE\s*=\s*({[\s\S]*?});/);
    
    // Pattern B: data-* attributes with IDs
    const dataIds = [...html.matchAll(/data-(?:auto-bulletin-id|bulletin-id|poi-id|property-id)="([^"]+)"/g)].map(m => m[1]);
    
    // Pattern C: bulletin/poi mentions in JSON-like data
    const jsonIdsBulletin = [...html.matchAll(/"id":"([a-zA-Z0-9_-]{8,40})"[^}]{0,200}"(?:Bulletin|Project|CommercialBulletin)"/g)].map(m => m[1]);
    const jsonIdsTypename = [...html.matchAll(/"__typename":"(?:Bulletin|Project|CommercialBulletin)"[^}]{0,200}"id":"([a-zA-Z0-9_-]{8,40})"/g)].map(m => m[1]);
    
    // Pattern D: any string that looks like a poi id (UUID or alphanumeric)
    const uuidMatches = [...html.matchAll(/"([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})"/g)].map(m => m[1]);
    
    // Pattern E: madlan-specific listing references
    const listingRefs = [...html.matchAll(/\/listings?\/([a-zA-Z0-9_-]+)/g)].map(m => m[1]);
    const projectRefs = [...html.matchAll(/\/projects?\/([a-zA-Z0-9_-]+)/g)].map(m => m[1]);
    
    // Pattern F: find any `poiByIds` reference / cached IDs
    const poiPattern = [...html.matchAll(/poi[_-]?id["':\s]+["']?([a-zA-Z0-9_-]{8,40})/gi)].slice(0, 10).map(m => m[1]);
    
    // Pattern G: search for "Bulletin:XXXXX" cache key pattern (Apollo style)
    const apolloKeys = [...html.matchAll(/"(?:Bulletin|Project|CommercialBulletin):([a-zA-Z0-9_-]+)"/g)].map(m => m[1]);
    
    return new Response(JSON.stringify({
      url,
      status: htmlRes.status,
      html_length: html.length,
      
      has_apollo_state: !!apolloMatch,
      apollo_state_size: apolloMatch ? apolloMatch[1].length : 0,
      
      has_initial_state: !!initialMatch,
      initial_state_size: initialMatch ? initialMatch[1].length : 0,
      
      has_redux_state: !!reduxMatch,
      
      data_ids_count: dataIds.length,
      data_ids_sample: dataIds.slice(0, 5),
      
      json_ids_bulletin_first: jsonIdsBulletin.length,
      json_ids_bulletin_sample: jsonIdsBulletin.slice(0, 5),
      
      json_ids_typename_first: jsonIdsTypename.length,
      json_ids_typename_sample: jsonIdsTypename.slice(0, 5),
      
      uuid_count: [...new Set(uuidMatches)].length,
      
      listing_refs_count: [...new Set(listingRefs)].length,
      listing_refs_sample: [...new Set(listingRefs)].slice(0, 5),
      
      project_refs_count: [...new Set(projectRefs)].length,
      project_refs_sample: [...new Set(projectRefs)].slice(0, 5),
      
      poi_pattern_sample: poiPattern,
      
      apollo_cache_keys_count: [...new Set(apolloKeys)].length,
      apollo_cache_keys_sample: [...new Set(apolloKeys)].slice(0, 10),
      
      // Search for words that might indicate where state is stored
      has_window_data: html.includes('window.__'),
      script_tags_with_state: [...html.matchAll(/<script[^>]*id="([^"]*(?:state|data|cache)[^"]*)"/gi)].map(m => m[1]),
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
