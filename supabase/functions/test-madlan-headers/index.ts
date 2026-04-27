import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

const LDJSON_FEATURE_MAP: Record<string, string> = {
  'נגיש לנכים':'accessible','מיזוג אוויר':'aircon','מרפסת':'balcony','מעלית':'elevator',
  'גינה':'yard','סורגים':'bars','בריכה':'pool','ממ״ד':'mamad','ממ"ד':'mamad','ממ״ק':'mamak',
  'מקלט':'shelter','מחסן':'storage','דוד שמש':'sun_water_heater','חניה':'parking',
  'מרוהט':'furnished','משופץ':'renovated',
};

function extractProductLdJson(html: string): any | null {
  const ldMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)];
  for (const m of ldMatches) {
    try {
      const parsed = JSON.parse(m[1]);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of arr) {
        if (item && (item['@type'] === 'Product' || item.offers?.price != null)) return item;
      }
    } catch {}
  }
  return null;
}

function parseMetaDescription(desc: string): any {
  const out: any = {};
  const decoded = decodeEntities(desc);
  const dashIdx = decoded.indexOf(' - ');
  const head = dashIdx > 0 ? decoded.slice(0, dashIdx) : decoded;
  const parts = head.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length >= 3) { out.address = parts[0]; out.neighborhood = parts[1]; out.city = parts.slice(2).join(', '); }
  else if (parts.length === 2) { out.address = parts[0]; out.city = parts[1]; }
  else if (parts.length === 1) { out.address = parts[0]; }
  const rm = decoded.match(/(\d+(?:\.\d+)?)\s*חדרים/);
  if (rm) { const r = parseFloat(rm[1]); if (r > 0 && r < 25) out.rooms = r; }
  const sm = decoded.match(/(\d+(?:\.\d+)?)\s*(?:מטר רבוע|מ['׳"״]?ר)/);
  if (sm) { const s = parseFloat(sm[1]); if (s > 0 && s < 5000) out.size = s; }
  return out;
}

function extractDetail(html: string, sourceId: string, sourceUrl: string): any {
  const result: any = { source_id: sourceId, source_url: sourceUrl, features: {} };
  const product = extractProductLdJson(html);
  if (product) {
    const offer = product.offers || {};
    if (offer.price != null) { const p = parseInt(String(offer.price).replace(/[^\d]/g,'')); if (p>0) result.price = p; }
    if (product.size) { const sm = String(product.size).match(/(\d+(?:\.\d+)?)/); if (sm) { const s = parseFloat(sm[1]); if (s>0 && s<5000) result.size = s; } }
    if (product.description) result.description = decodeEntities(String(product.description)).slice(0, 5000);
    if (product.image) { const imgs = Array.isArray(product.image) ? product.image : [product.image]; result.images = imgs.filter((x:any)=>typeof x==='string').slice(0,30); }
    if (Array.isArray(product.additionalProperty)) {
      for (const p of product.additionalProperty) {
        const name = String(p?.name||'').trim(); const val = String(p?.value||'').trim();
        const fk = LDJSON_FEATURE_MAP[name];
        if (fk) result.features[fk] = (val === 'כן');
      }
    }
  }
  const md = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/);
  if (md) {
    const p = parseMetaDescription(md[1]);
    if (p.address) result.address = p.address;
    if (p.neighborhood) result.neighborhood = p.neighborhood;
    if (p.city) result.city = p.city;
    if (p.rooms && !result.rooms) result.rooms = p.rooms;
    if (p.size && !result.size) result.size = p.size;
  }
  const tm = html.match(/<title[^>]*>([^<]+)<\/title>/);
  if (tm) {
    result.title = decodeEntities(tm[1]).replace(/\s*\|.*$/,'').trim();
    const t = decodeEntities(tm[1]);
    if (/להשכרה/.test(t)) result.deal = 'rent';
    else if (/למכירה/.test(t)) result.deal = 'sale';
    const km = t.match(/^([^:]+?)\s*(?:להשכרה|למכירה)/);
    if (km) result.property_kind = km[1].trim();
  }
  if (/data-auto=["']agent-tag["']|"agencyName"|מתווך|תיווך/i.test(html)) result.is_private = false;
  return result;
}

async function fetchWithRetry(url: string, retries = 3): Promise<{html: string|null, status: number, attempts: number}> {
  for (let i = 0; i < retries; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(()=>ctrl.abort(), 20000);
      const res = await fetch(url, { headers: { 'User-Agent': IPHONE_UA, 'Accept': 'text/html', 'Accept-Language': 'he-IL,he;q=0.9' }, signal: ctrl.signal });
      clearTimeout(timer);
      const html = await res.text();
      if (res.ok && html.length > 50000) return { html, status: res.status, attempts: i+1 };
      if (i < retries - 1) await new Promise(r => setTimeout(r, 2000 + i * 2000));
    } catch { if (i < retries - 1) await new Promise(r => setTimeout(r, 2000)); }
  }
  return { html: null, status: 0, attempts: retries };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const body = await req.json().catch(() => ({}));
  const ids: string[] = body.ids || ['1Xcd5eXJA2P'];
  const results: any[] = [];
  for (const id of ids) {
    const url = `https://www.madlan.co.il/listings/${id}`;
    const { html, status, attempts } = await fetchWithRetry(url, 3);
    if (!html) { results.push({ id, status, attempts, error: 'fetch_failed' }); continue; }
    const detail = extractDetail(html, id, url);
    results.push({ id, status, attempts, ok: true, ...detail });
    await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
  }
  const summary = {
    total: results.length,
    ok: results.filter(r => r.ok).length,
    with_price: results.filter(r => r.price).length,
    with_address: results.filter(r => r.address).length,
    with_rooms: results.filter(r => r.rooms).length,
    with_size: results.filter(r => r.size).length,
    with_features: results.filter(r => r.features && Object.keys(r.features).length > 0).length,
  };
  return new Response(JSON.stringify({ summary, results }, null, 2), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
