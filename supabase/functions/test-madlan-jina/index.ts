import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * TEST: Jina vs Direct Fetch for Madlan removal detection
 * Compare if Jina can see "המודעה הוסרה" that Direct Fetch misses
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const urls: string[] = body.urls || [
    // Known active
    'https://www.madlan.co.il/listings/VhDsqEacMI2',
    // User confirmed this is removed (בן סירא 18)
    'https://www.madlan.co.il/listings/9swhASxwUDb',
    // User confirmed this is ACTIVE but was falsely marked inactive (יוסף קארו 27)
    'https://www.madlan.co.il/listings/htSIhWTSg7o',
  ];

  const results: any[] = [];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`https://r.jina.ai/${url}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/markdown',
          'X-Wait-For-Selector': 'body',
          'X-Timeout': '25',
          'X-Locale': 'he-IL',
          'X-No-Cache': 'true',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const markdown = await response.text();
      
      const hasRemovedText = markdown.includes('המודעה הוסרה');
      const hasPrice = /₪|ש"ח/.test(markdown);
      const hasRooms = /חדרים/.test(markdown);
      
      // Extract first 500 chars for review
      const preview = markdown.substring(0, 800);

      results.push({
        url,
        jina_status: response.status,
        markdown_length: markdown.length,
        has_removed_text: hasRemovedText,
        has_price: hasPrice,
        has_rooms: hasRooms,
        preview,
      });
    } catch (err) {
      results.push({ url, error: String(err) });
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
