import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * TEST: Deep HTML analysis for Madlan active vs removed listings
 * Looking for ANY signal that differentiates them
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const urls: string[] = body.urls || [
    // Known ACTIVE
    'https://www.madlan.co.il/listings/VhDsqEacMI2',
    'https://www.madlan.co.il/listings/grFEJNZgg9B',
    // Marked inactive via homepage_size - user says ACTIVE (false positive)
    'https://www.madlan.co.il/listings/htSIhWTSg7o',
    // Marked inactive via homepage_size
    'https://www.madlan.co.il/listings/9swhASxwUDb',
    // Marked inactive via 410
    'https://www.madlan.co.il/listings/NHVnK1i01t6',
  ];

  const results: any[] = [];

  for (const url of urls) {
    const listingId = url.split('/listings/')[1];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const html = await response.text();
      
      // Extract key signals
      const title = html.match(/<title>(.*?)<\/title>/)?.[1] || null;
      const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"[^>]*>/)?.[1] || null;
      const ogUrl = html.match(/<meta[^>]*property="og:url"[^>]*content="([^"]*)"[^>]*>/)?.[1] || null;
      const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/)?.[1] || null;
      const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/)?.[1]?.substring(0, 200) || null;
      const robots = html.match(/<meta[^>]*name="robots"[^>]*content="([^"]*)"[^>]*>/)?.[1] || null;
      
      // Check if canonical/og:url matches the listing URL
      const canonicalMatchesListing = canonical?.includes('/listings/') || false;
      const ogUrlMatchesListing = ogUrl?.includes('/listings/') || false;
      
      // Check for listing-specific structured data (JSON-LD)
      const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) || [];
      const jsonLdWithListing = jsonLdMatches.filter(s => s.includes(listingId));
      
      // Check for specific CSS classes or data attributes
      const hasListingContainer = html.includes('data-listing-id') || html.includes('listing-details');
      
      // Look for __APP_DATA__ or similar embedded state
      const appDataPatterns = [
        '__NEXT_DATA__', '__APP_DATA__', '__INITIAL_STATE__', 
        '__APOLLO_STATE__', '__NUXT__', 'window.__data',
        'listing_data', 'listingData'
      ];
      const foundPatterns = appDataPatterns.filter(p => html.includes(p));
      
      // Count occurrences of listing ID in HTML
      const listingIdOccurrences = (html.match(new RegExp(listingId, 'g')) || []).length;
      
      // Check for specific script tags that might contain listing data
      const scriptTags = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
      const scriptsWithListingId = scriptTags.filter(s => s.includes(listingId)).length;
      
      // Look for any "removed" or "הוסרה" in script tags or data attributes
      const removedInScripts = scriptTags.some(s => 
        s.includes('המודעה הוסרה') || s.includes('isRemoved') || 
        s.includes('"removed"') || s.includes('"status":"removed"')
      );
      
      // Check HTTP status and response headers
      const responseHeaders: Record<string, string> = {};
      for (const [key, value] of response.headers.entries()) {
        if (['x-redirect', 'location', 'x-listing-status', 'x-page-type'].includes(key.toLowerCase())) {
          responseHeaders[key] = value;
        }
      }

      results.push({
        url,
        listing_id: listingId,
        http_status: response.status,
        html_length: html.length,
        title: title?.substring(0, 120),
        canonical,
        canonical_matches_listing: canonicalMatchesListing,
        og_url: ogUrl,
        og_url_matches_listing: ogUrlMatchesListing,
        og_title: ogTitle?.substring(0, 120),
        og_description: ogDesc,
        robots,
        json_ld_count: jsonLdMatches.length,
        json_ld_with_listing: jsonLdWithListing.length,
        has_listing_container: hasListingContainer,
        found_data_patterns: foundPatterns,
        listing_id_occurrences: listingIdOccurrences,
        scripts_with_listing_id: scriptsWithListingId,
        removed_indicator_in_scripts: removedInScripts,
        special_headers: responseHeaders,
      });
    } catch (err) {
      results.push({ url, listing_id: listingId, error: String(err) });
    }

    await new Promise(r => setTimeout(r, 500));
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
