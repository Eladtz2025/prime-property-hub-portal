import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * TEST: Verify Madlan removal detection via title/og tags
 * Tests active and removed listings to confirm correct classification
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const urls: string[] = body.urls || [
    // Known ACTIVE listings
    'https://www.madlan.co.il/listings/VhDsqEacMI2',
    'https://www.madlan.co.il/listings/htSIhWTSg7o',
    // Known REMOVED (returns 410)
    'https://www.madlan.co.il/listings/NHVnK1i01t6',
    'https://www.madlan.co.il/listings/R1qvoUiesHQ',
  ];

  const results: any[] = [];

  for (const url of urls) {
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
      const title = html.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/)?.[1] || '';
      const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/)?.[1] || '';

      // Apply same logic as the updated checkMadlanDirect
      let detected = 'active';
      let reason = 'content_ok';

      if (response.status === 404 || response.status === 410) {
        detected = 'removed';
        reason = `listing_removed_${response.status}`;
      } else if (title.includes('המודעה הוסרה')) {
        detected = 'removed';
        reason = 'listing_removed_title';
      } else if (ogDesc.includes('המודעה המבוקשת כבר אינה מפורסמת') || ogDesc.includes('המודעה הוסרה')) {
        detected = 'removed';
        reason = 'listing_removed_og_description';
      } else if (ogTitle.includes('המודעה הוסרה')) {
        detected = 'removed';
        reason = 'listing_removed_og_title';
      }

      results.push({
        url,
        http_status: response.status,
        html_length: html.length,
        title: title.substring(0, 100),
        detected,
        reason,
      });
    } catch (err) {
      results.push({ url, error: String(err) });
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
