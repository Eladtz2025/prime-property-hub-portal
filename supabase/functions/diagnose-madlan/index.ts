import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url).searchParams.get('url') || 'https://www.madlan.co.il/listings/01w4bX4oclP';

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': IPHONE_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
      },
    });
    const html = await res.text();

    // Detect signals
    const signals = {
      url,
      status: res.status,
      contentType: res.headers.get('content-type'),
      htmlLength: html.length,
      isCloudflareChallenge: html.includes('__cf_chl_opt') || html.includes('Just a moment'),
      hasNextData: html.includes('__NEXT_DATA__'),
      hasApolloState: html.includes('__APOLLO_STATE__'),
      hasJsonLd: html.includes('application/ld+json'),
      hasReactDom: html.includes('react-dom'),
      hasPriceSymbol: html.includes('₪'),
      occurrencesOfPrice: (html.match(/₪/g) || []).length,
      // Look for any common Madlan patterns
      hasListingId: html.includes('listingId') || html.includes('listing_id'),
      hasGqlState: html.includes('__GQL_STATE__'),
      hasRedux: html.includes('__REDUX_STATE__') || html.includes('window.__INITIAL_STATE__'),
      // Title and og tags (proves page rendered)
      titleTag: (html.match(/<title>([^<]+)<\/title>/)?.[1] || '').slice(0, 200),
      ogTitle: (html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)/)?.[1] || '').slice(0, 200),
      ogDescription: (html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)/)?.[1] || '').slice(0, 300),
      // Snippets of any embedded JSON
      nextDataSnippet: (() => {
        const m = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([^<]{0,500})/);
        return m ? m[1] : null;
      })(),
      // SSR hydration context - look for the assignment and capture a large window
      ssrHydratedContextSnippet: (() => {
        const idx = html.indexOf('__SSR_HYDRATED_CONTEXT__');
        if (idx === -1) return null;
        return html.slice(idx, idx + 8000);
      })(),
      localizeSsrConfigSnippet: (() => {
        const idx = html.indexOf('__LOCALIZE_SSR_CONFIG__');
        if (idx === -1) return null;
        return html.slice(idx, idx + 2000);
      })(),
      // All JSON-LD blocks
      jsonLdBlocks: (() => {
        const blocks: string[] = [];
        const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
        let m;
        while ((m = re.exec(html)) !== null) {
          blocks.push(m[1].slice(0, 2000));
        }
        return blocks;
      })(),
      // Look for any inline script that mentions key property fields
      scriptsWithRooms: (() => {
        const re = /<script[^>]*>([\s\S]*?)<\/script>/gi;
        const hits: string[] = [];
        let m;
        while ((m = re.exec(html)) !== null) {
          const s = m[1];
          if (s.includes('rooms') || s.includes('"floor"') || s.includes('agentName') || s.includes('isPrivate')) {
            hits.push(s.slice(0, 1500));
            if (hits.length >= 3) break;
          }
        }
        return hits;
      })(),
      // First 2000 chars of body to see structure
      bodySnippet: html.slice(0, 2000),
    };

    return new Response(JSON.stringify(signals, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
