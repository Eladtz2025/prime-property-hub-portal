import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Probe: try to fetch a Madlan search-results page from the Supabase Edge IP
 * using the minimal Next.js bypass headers that work for the detail parser.
 * Goal: understand the response (HTML vs JSON, status, structure) before
 * building scout-madlan-nextjs.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const url = body.url || 'https://www.madlan.co.il/for-rent/תל-אביב-יפו-ישראל?page=1';

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const start = Date.now();
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/html',
        'X-Nextjs-Data': '1',
        'Accept-Language': 'he-IL,he;q=0.9',
      },
      signal: ctrl.signal,
    });
    const elapsed = Date.now() - start;
    const text = await res.text();
    clearTimeout(timer);

    const result: any = {
      url,
      status: res.status,
      ms: elapsed,
      bytes: text.length,
      contentType: res.headers.get('content-type'),
      isHtml: text.trimStart().startsWith('<'),
      isJson: text.trimStart().startsWith('{') || text.trimStart().startsWith('['),
    };

    // Try direct JSON
    if (result.isJson) {
      try {
        const j = JSON.parse(text);
        result.jsonTopKeys = Object.keys(j);
        const pp = j?.pageProps || j?.props?.pageProps;
        if (pp) result.pagePropsKeys = Object.keys(pp);
        // Find arrays of objects with id/price
        const arrays: any[] = [];
        const walk = (o: any, path = '', depth = 0) => {
          if (depth > 5 || !o || typeof o !== 'object') return;
          for (const k of Object.keys(o)) {
            const v = o[k];
            if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0]) {
              const keys = Object.keys(v[0]);
              if (keys.some(x => /price|rooms|address|poi|listing|^id$/i.test(x))) {
                arrays.push({ path: `${path}.${k}`, length: v.length, sampleKeys: keys.slice(0, 25) });
              }
            } else if (v && typeof v === 'object') walk(v, `${path}.${k}`, depth + 1);
          }
        };
        walk(j);
        result.candidateArrays = arrays;
      } catch (e) { result.jsonParseError = String(e); }
    }

    // Try __NEXT_DATA__ from HTML
    if (result.isHtml) {
      const m = text.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (m) {
        try {
          const j = JSON.parse(m[1]);
          result.nextDataBuildId = j.buildId;
          const pp = j?.props?.pageProps;
          if (pp) result.nextDataPagePropsKeys = Object.keys(pp);
          const arrays: any[] = [];
          const walk = (o: any, path = '', depth = 0) => {
            if (depth > 6 || !o || typeof o !== 'object') return;
            for (const k of Object.keys(o)) {
              const v = o[k];
              if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0]) {
                const keys = Object.keys(v[0]);
                if (keys.some(x => /price|rooms|address|poi|listing|^id$/i.test(x))) {
                  arrays.push({ path: `${path}.${k}`, length: v.length, sampleKeys: keys.slice(0, 25) });
                }
              } else if (v && typeof v === 'object') walk(v, `${path}.${k}`, depth + 1);
            }
          };
          walk(j);
          result.nextDataArrays = arrays;
        } catch (e) { result.nextDataParseError = String(e); }
      } else {
        result.nextDataMissing = true;
        result.htmlSnippet = text.substring(0, 800);
      }
    }

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    clearTimeout(timer);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e), url }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
