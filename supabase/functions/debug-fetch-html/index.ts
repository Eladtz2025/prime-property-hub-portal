// Temporary debug function to inspect Madlan HTML structure
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'url required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' },
    });

    const html = await response.text();

    // Extract <title>
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1] || null;

    // Extract all <meta> tags
    const metaTags: Record<string, string> = {};
    const metaRegex = /<meta[^>]*(?:name|property)="([^"]*)"[^>]*content="([^"]*)"[^>]*>/gi;
    let match;
    while ((match = metaRegex.exec(html)) !== null) {
      metaTags[match[1]] = match[2];
    }

    // Extract __NEXT_DATA__
    let nextData: any = null;
    const nextDataMatch = html.match(/<script\s+id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (nextDataMatch) {
      try {
        nextData = JSON.parse(nextDataMatch[1]);
      } catch {
        nextData = { raw: nextDataMatch[1].substring(0, 2000) };
      }
    }

    // First/last 500 chars of body
    const bodyMatch = html.match(/<body[^>]*>(.*)<\/body>/s);
    const bodyContent = bodyMatch?.[1] || '';
    const bodyFirst500 = bodyContent.substring(0, 500);
    const bodyLast500 = bodyContent.substring(Math.max(0, bodyContent.length - 500));

    return new Response(JSON.stringify({
      status: response.status,
      html_length: html.length,
      title,
      meta_tags: metaTags,
      has_next_data: !!nextDataMatch,
      next_data: nextData,
      body_first_500: bodyFirst500,
      body_last_500: bodyLast500,
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
