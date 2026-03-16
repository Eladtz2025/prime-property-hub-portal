// Helper to analyze Madlan HTML structure - temporary

export function analyzeMadlanHtml(html: string): any {
  // Look for listing links
  const listingLinks = html.match(/href="\/listings\/[^"]+"/g) || [];
  const uniqueListings = [...new Set(listingLinks.map(l => l.match(/\/listings\/([^"]+)/)?.[1]))];

  // Look for __NEXT_DATA__ (Next.js SSR data)
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  
  // Look for window.__APOLLO_STATE__ or similar state injection
  const apolloMatch = html.match(/window\.__APOLLO_STATE__\s*=\s*({[\s\S]*?});?\s*<\/script>/);
  
  // Look for JSON-LD structured data
  const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];

  // Extract a sample listing area - find first listing link and get surrounding context
  let sampleContext = '';
  const firstListingIdx = html.indexOf('/listings/');
  if (firstListingIdx > 0) {
    // Get 2000 chars before and after
    const start = Math.max(0, firstListingIdx - 1500);
    const end = Math.min(html.length, firstListingIdx + 1500);
    sampleContext = html.substring(start, end);
  }

  // Check for data attributes
  const dataAutoAttrs = [...new Set((html.match(/data-auto="[^"]+"/g) || []))];
  
  // Check for price patterns in HTML
  const pricePatterns = html.match(/[\d,]+\s*₪/g) || [];

  return {
    total_length: html.length,
    unique_listings: uniqueListings.length,
    listing_ids_sample: uniqueListings.slice(0, 5),
    has_next_data: !!nextDataMatch,
    next_data_length: nextDataMatch?.[1]?.length || 0,
    has_apollo_state: !!apolloMatch,
    json_ld_count: jsonLdMatches.length,
    data_auto_attrs: dataAutoAttrs.slice(0, 30),
    price_count: pricePatterns.length,
    price_sample: pricePatterns.slice(0, 5),
    sample_context: sampleContext.substring(0, 3000),
  };
}
