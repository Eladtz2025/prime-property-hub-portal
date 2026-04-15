import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const url = body.url || 'https://www.madlan.co.il/listings/yDRjYNhIG4I';

  const res = await fetch(url, {
    headers: { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' },
  });
  const html = await res.text();
  
  const results: Record<string, any> = {
    status: res.status,
    size: html.length,
  };

  // Search for amenity-related patterns
  const patterns = [
    'amenity', 'amenities', 'data-auto', 'balcon', 'elevator', 'מרפסת', 'מעלית',
    'חניה', 'parking', 'ממד', 'secureRoom', 'מחסן', 'storage',
    'מיזוג', 'airCondition', 'נגיש', 'accessible', 'חיות', 'pets',
    'מרוהט', 'furnished', 'משופצ', 'renovated', 'גינה', 'garden',
    'IconOption', 'feature-item', 'property-feature',
    'bulletin-feature', 'poi-feature', 'specification',
  ];

  results.pattern_matches = {};
  for (const p of patterns) {
    const regex = new RegExp(p, 'gi');
    const matches = html.match(regex);
    if (matches) {
      results.pattern_matches[p] = matches.length;
    }
  }

  // Find context around amenity-related content
  const searchTerms = ['מרפסת', 'מעלית', 'חניה', 'ממד', 'מחסן', 'מיזוג', 'amenity', 'data-auto="bulletin'];
  results.contexts = {};
  for (const term of searchTerms) {
    const idx = html.indexOf(term);
    if (idx >= 0) {
      results.contexts[term] = html.substring(Math.max(0, idx - 200), idx + 300);
    }
  }

  // Find all data-auto values
  const dataAutoMatches = html.match(/data-auto="[^"]+"/g);
  if (dataAutoMatches) {
    const unique = [...new Set(dataAutoMatches)];
    results.data_auto_values = unique.slice(0, 40);
  }

  // Find script tags with JSON (might contain inline data)
  const scriptMatches = html.match(/<script[^>]*type="application\/json"[^>]*>/g);
  results.json_scripts = scriptMatches;

  // Look for window.__data or similar
  const windowDataPatterns = ['window.__', 'window._app', '__APOLLO', 'INITIAL_STATE', 'initialData', '__data'];
  results.window_data = {};
  for (const p of windowDataPatterns) {
    const idx = html.indexOf(p);
    if (idx >= 0) {
      results.window_data[p] = html.substring(idx, idx + 200);
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
