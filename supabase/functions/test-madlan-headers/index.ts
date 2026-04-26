import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const body = await req.json().catch(() => ({}));
  const id = body.id || '1Xcd5eXJA2P';
  const url = `https://www.madlan.co.il/listings/${id}`;
  const res = await fetch(url, { headers: { 'User-Agent': IPHONE_UA, 'Accept': 'text/html', 'Accept-Language': 'he-IL,he;q=0.9' } });
  const html = await res.text();

  const findings: any = { status: res.status, bytes: html.length };
  
  // Pattern probes
  const probes = ['__APOLLO_STATE__','__NEXT_DATA__','__INITIAL_STATE__','window.__','application/ld+json','__PRELOADED','self.__next_f','"price"','"rooms"','"address"','₪','חדרים','מ"ר'];
  findings.probes = {};
  for (const p of probes) {
    const idx = html.indexOf(p);
    findings.probes[p] = idx >= 0 ? idx : null;
  }

  // Sample around price
  const priceIdx = html.indexOf('"price"');
  if (priceIdx >= 0) findings.price_context = html.slice(priceIdx, priceIdx + 500);

  // ld+json blocks - extract ALL and find the one with price
  const ldMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)];
  findings.ld_json_count = ldMatches.length;
  findings.ld_json_parsed = [];
  for (const m of ldMatches) {
    try {
      const parsed = JSON.parse(m[1]);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of arr) {
        if (item && (item['@type'] === 'Product' || item['@type'] === 'Apartment' || item['@type'] === 'Residence' || JSON.stringify(item).includes('"price"'))) {
          findings.ld_json_parsed.push(item);
        }
      }
    } catch (e) { findings.ld_json_parsed.push({ parse_error: String(e), raw: m[1].slice(0,300) }); }
  }
  // Also check window.__ context
  const winIdx = html.indexOf('window.__');
  if (winIdx >= 0) findings.window_context = html.slice(winIdx, winIdx + 600);

  // self.__next_f
  const nextF = [...html.matchAll(/self\.__next_f\.push\(\[(\d+),"([\s\S]{20,2000}?)"\]\)/g)];
  findings.next_f_count = nextF.length;
  findings.next_f_first = nextF.slice(0,2).map(m => m[2].slice(0, 1000));

  // shekel/rooms hits
  findings.shekel_hits = [...html.matchAll(/(\d{1,3}(?:,\d{3})+)\s*₪/g)].slice(0,5).map(m=>m[0]);
  findings.rooms_hits = [...html.matchAll(/(\d+(?:\.\d+)?)\s*חדרים/g)].slice(0,5).map(m=>m[0]);
  // Meta tags & title (often contain rooms for THIS listing)
  const metaDesc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/);
  findings.meta_description = metaDesc ? metaDesc[1] : null;
  const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/);
  findings.og_title = ogTitle ? ogTitle[1] : null;
  const titleM = html.match(/<title[^>]*>([^<]+)<\/title>/);
  findings.title = titleM ? titleM[1] : null;
  // First h1
  const h1 = html.match(/<h1[^>]*>([\s\S]{0,300}?)<\/h1>/);
  findings.h1 = h1 ? h1[1].replace(/<[^>]+>/g,'').trim() : null;

  return new Response(JSON.stringify(findings, null, 2), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
