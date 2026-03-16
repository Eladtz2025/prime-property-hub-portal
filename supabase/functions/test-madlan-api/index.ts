import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * TEST: Madlan internal API availability check
 * Tests if we can detect removed listings via Madlan's GraphQL/API
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const urls: string[] = body.urls || [
    // Known active
    'https://www.madlan.co.il/listings/VhDsqEacMI2',
    'https://www.madlan.co.il/listings/YndCCCBnQBf',
    // Known removed (homepage_size)
    'https://www.madlan.co.il/listings/9swhASxwUDb',
    'https://www.madlan.co.il/listings/htSIhWTSg7o',
  ];

  const results: any[] = [];

  for (const url of urls) {
    const listingId = url.split('/listings/')[1];
    if (!listingId) {
      results.push({ url, error: 'no listing ID found' });
      continue;
    }

    try {
      // Strategy 1: Direct fetch and look for __NEXT_DATA__ or embedded JSON
      const directResult = await testDirectFetch(url, listingId);
      
      // Strategy 2: Try Madlan's GraphQL API endpoint
      const apiResult = await testGraphQLApi(listingId);

      results.push({
        url,
        listing_id: listingId,
        direct_fetch: directResult,
        graphql_api: apiResult,
      });
    } catch (err) {
      results.push({ url, listing_id: listingId, error: String(err) });
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

async function testDirectFetch(url: string, listingId: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const html = await response.text();
    
    // Look for __NEXT_DATA__ script tag
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    let nextData: any = null;
    let hasListingData = false;
    let listingStatus: string | null = null;

    if (nextDataMatch) {
      try {
        nextData = JSON.parse(nextDataMatch[1]);
        // Try to find listing-related data in the Next.js props
        const propsStr = JSON.stringify(nextData);
        hasListingData = propsStr.includes(listingId);
        
        // Check for common status indicators
        if (propsStr.includes('"isRemoved":true') || propsStr.includes('"removed":true')) {
          listingStatus = 'removed';
        } else if (propsStr.includes('"isRemoved":false') || propsStr.includes(listingId)) {
          listingStatus = 'active';
        }
      } catch { /* ignore parse errors */ }
    }

    // Look for Apollo/GraphQL state
    const apolloMatch = html.match(/window\.__APOLLO_STATE__\s*=\s*({[\s\S]*?});?\s*<\/script>/);
    let apolloData: any = null;
    let apolloHasListing = false;

    if (apolloMatch) {
      try {
        apolloData = JSON.parse(apolloMatch[1]);
        apolloHasListing = JSON.stringify(apolloData).includes(listingId);
      } catch { /* ignore */ }
    }

    // Look for any JSON script tags with listing data
    const jsonScripts = html.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g) || [];
    const jsonWithListing = jsonScripts.filter(s => s.includes(listingId));

    // Check for "המודעה הוסרה" in raw HTML
    const hasRemovedText = html.includes('המודעה הוסרה');
    
    // Check for listing-specific HTML markers
    const hasPrice = /₪|ש"ח|שקל/i.test(html) && /\d{3,}/.test(html);
    const hasRooms = /חדרים/.test(html);
    const hasFloor = /קומה/.test(html);

    return {
      status: response.status,
      html_length: html.length,
      final_url: response.url,
      has_next_data: !!nextDataMatch,
      next_data_has_listing: hasListingData,
      listing_status_from_next_data: listingStatus,
      has_apollo_state: !!apolloMatch,
      apollo_has_listing: apolloHasListing,
      json_scripts_count: jsonScripts.length,
      json_scripts_with_listing: jsonWithListing.length,
      has_removed_text_in_html: hasRemovedText,
      has_price_indicator: hasPrice,
      has_rooms_indicator: hasRooms,
      has_floor_indicator: hasFloor,
      // Sample of page title
      page_title: html.match(/<title>(.*?)<\/title>/)?.[1]?.substring(0, 100) || null,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return { error: String(err) };
  }
}

async function testGraphQLApi(listingId: string) {
  // Try Madlan's known GraphQL endpoint
  const graphqlEndpoints = [
    'https://www.madlan.co.il/api2',
    'https://www.madlan.co.il/api/graphql',
    'https://www.madlan.co.il/graphql',
    'https://gw.madlan.co.il/graphql',
  ];

  const graphqlQuery = {
    query: `query GetListing($id: String!) {
      listing(id: $id) {
        id
        status
        isRemoved
        address
        price
        rooms
      }
    }`,
    variables: { id: listingId },
  };

  const endpointResults: any[] = [];

  for (const endpoint of graphqlEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': 'he-IL,he;q=0.9',
        },
        body: JSON.stringify(graphqlQuery),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const text = await response.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch { /* not json */ }

      endpointResults.push({
        endpoint,
        status: response.status,
        response_length: text.length,
        is_json: !!json,
        response_preview: text.substring(0, 500),
      });
    } catch (err) {
      endpointResults.push({
        endpoint,
        error: String(err),
      });
    }
  }

  return endpointResults;
}
