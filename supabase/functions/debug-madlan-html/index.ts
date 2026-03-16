import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  
  const { urls } = await req.json();
  const results = [];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' },
      });

      const html = await response.text();
      
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch?.[1] || 'NO_TITLE';

      // Extract canonical
      const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"[^>]*>/i);
      const canonical = canonicalMatch?.[1] || 'NO_CANONICAL';

      // Extract og:url
      const ogUrlMatch = html.match(/<meta[^>]*property="og:url"[^>]*content="([^"]*)"[^>]*>/i);
      const ogUrl = ogUrlMatch?.[1] || 'NO_OG_URL';

      // Check for listing ID in URL
      const listingId = url.split('/listings/')[1]?.split('?')[0] || '';
      const htmlContainsListingId = listingId ? html.includes(listingId) : false;

      // Check response.url
      const finalUrl = response.url;

      results.push({
        requested_url: url,
        final_url: finalUrl,
        redirected: finalUrl !== url,
        status: response.status,
        html_length: html.length,
        title,
        canonical,
        og_url: ogUrl,
        listing_id: listingId,
        html_contains_listing_id: htmlContainsListingId,
      });
    } catch (e) {
      results.push({ requested_url: url, error: String(e) });
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
