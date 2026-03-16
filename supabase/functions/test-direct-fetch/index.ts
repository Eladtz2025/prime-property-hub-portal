import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * TEST ONLY - Direct Fetch Diagnostic for Madlan
 * Tests whether Edge Functions can directly fetch Madlan listing pages
 * without Jina or any other scraping service.
 * 
 * Does NOT save anything to DB. Safe to delete after testing.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const page = body.page ?? 1;
  const city = body.city ?? 'תל-אביב-יפו-ישראל';
  const dealType = body.deal_type ?? 'for-rent';

  const url = `https://www.madlan.co.il/${dealType}/${encodeURIComponent(city)}?page=${page}`;
  
  console.log(`🧪 Test Direct Fetch: ${url}`);
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const duration = Date.now() - startTime;
    const html = await response.text();

    // Diagnostics
    const hasListings = html.includes('/listings/') || html.includes('data-auto="listing');
    const listingLinkCount = (html.match(/\/listings\/[A-Za-z0-9]+/g) || []).length;
    const uniqueListings = new Set(html.match(/\/listings\/[A-Za-z0-9]+/g) || []);
    const hasPricePattern = (html.match(/₪|NIS|מחיר/g) || []).length;
    const hasRoomsPattern = (html.match(/חד[׳']/g) || []).length;
    const hasBlocked = html.includes('captcha') || html.includes('CAPTCHA') || html.includes('blocked');
    const hasContent = html.length > 5000;

    // Try to extract a sample listing URL
    const sampleListings = [...uniqueListings].slice(0, 5);

    const result = {
      success: true,
      url,
      page,
      duration_ms: duration,
      http_status: response.status,
      html_length: html.length,
      diagnostics: {
        has_content: hasContent,
        has_listings: hasListings,
        listing_links_total: listingLinkCount,
        unique_listing_links: uniqueListings.size,
        price_mentions: hasPricePattern,
        rooms_mentions: hasRoomsPattern,
        appears_blocked: hasBlocked,
        sample_listings: sampleListings,
      },
      // First 500 chars of HTML for quick inspection
      html_preview: html.substring(0, 500),
      // Last 500 chars
      html_tail: html.substring(Math.max(0, html.length - 500)),
    };

    console.log(`🧪 Result: status=${response.status} | ${html.length} chars | ${uniqueListings.size} unique listings | ${duration}ms`);

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`🧪 Direct fetch failed: ${errorMsg}`);

    return new Response(JSON.stringify({
      success: false,
      url,
      page,
      duration_ms: duration,
      error: errorMsg,
    }, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
