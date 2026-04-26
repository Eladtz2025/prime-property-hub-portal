import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

const safeText = (value: string, max = 700) => value.replace(/\s+/g, ' ').slice(0, max);
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function extractListingIds(html: string): string[] {
  return [...new Set([...html.matchAll(/\/listings?\/([a-zA-Z0-9_-]{6,40})/g)].map(m => m[1]))]
    .filter(id => !/^(undefined|null|search|index)$/i.test(id));
}

function extractFields(text: string) {
  const price = text.match(/"price"\s*:\s*"?(\d{4,9})"?/)?.[1];
  const rooms = text.match(/"rooms?"\s*:\s*"?(\d+(?:\.\d+)?)"?/)?.[1];
  const address = text.match(/"address(?:Title|String)?"\s*:\s*"([^"\\]{3,160})"/)?.[1]
    || text.match(/"address"\s*:\s*\{[^}]*"name"\s*:\s*"([^"\\]{3,160})"/)?.[1];
  const size = text.match(/"(?:area|squareMeter|size)"\s*:\s*"?(\d{2,5})"?/)?.[1];
  const floor = text.match(/"floor"\s*:\s*"?(-?\d+)"?/)?.[1];
  const pocType = text.match(/"(?:pocType|contactType)"\s*:\s*"([^"\\]+)"/)?.[1];
  const agencyName = text.match(/"agencyName"\s*:\s*"([^"\\]+)"/)?.[1];
  return {
    price: price ? Number(price) : null,
    rooms: rooms ? Number(rooms) : null,
    address: address || null,
    size: size ? Number(size) : null,
    floor: floor ? Number(floor) : null,
    pocType: pocType || null,
    agencyName: agencyName || null,
    usable: Boolean(price || rooms || address || size || floor || pocType || agencyName),
  };
}

async function fetchText(url: string, init: RequestInit, timeoutMs = 25000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const text = await res.text();
    return { status: res.status, ok: res.ok, bytes: text.length, text, contentType: res.headers.get('content-type') };
  } finally {
    clearTimeout(timeoutId);
  }
}

function summarize(name: string, url: string, response: { status: number; ok: boolean; bytes: number; text: string; contentType: string | null }) {
  const text = response.text;
  const apollo = text.match(/window\.__APOLLO_STATE__\s*=\s*({[\s\S]*?})\s*;?\s*<\/script>/)?.[1];
  const next = text.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  const jsonSource = apollo || next || text;
  const fields = extractFields(jsonSource);
  const blockedMarkers = /cloudflare|perimeterx|_pxAppId|access denied|captcha|forbidden|robot/i.test(text);
  return {
    method: name,
    url,
    status: response.status,
    ok: response.ok,
    bytes: response.bytes,
    content_type: response.contentType,
    has_apollo_state: Boolean(apollo),
    has_next_data: Boolean(next),
    blocked_markers: blockedMarkers,
    fields,
    success: response.ok && fields.usable && !blockedMarkers,
    snippet: safeText(text),
  };
}

async function runAttempt(name: string, url: string, init: RequestInit) {
  try {
    const response = await fetchText(url, init);
    return summarize(name, url, response);
  } catch (error) {
    return { method: name, url, success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const path = body.path || 'for-rent/' + encodeURIComponent('תל-אביב-יפו-ישראל') + '?page=1';
    const searchUrl = body.searchUrl || `https://www.madlan.co.il/${path}`;
    const sampleSize = Math.max(1, Math.min(Number(body.sampleSize || 5), 20));

    const searchVariants: Array<{ name: string; headers: Record<string, string> }> = [
      { name: 'search_iphone_html', headers: { 'User-Agent': IPHONE_UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'he-IL,he;q=0.9' } },
      { name: 'search_next_json_minimal', headers: { 'Accept': 'application/json', 'X-Nextjs-Data': '1', 'Accept-Language': 'he-IL,he;q=0.9' } },
      { name: 'search_desktop_html', headers: { 'User-Agent': DESKTOP_UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'he-IL,he;q=0.9' } },
    ];

    const searchAttempts = [];
    let listingIds: string[] = Array.isArray(body.testIds) ? body.testIds : [];

    for (const variant of searchVariants) {
      const attempt = await runAttempt(variant.name, searchUrl, { headers: variant.headers });
      searchAttempts.push(attempt);

      if (listingIds.length === 0 && 'status' in attempt && typeof attempt.snippet === 'string') {
        // Re-fetch only when needed because snippet is intentionally truncated.
        const full = await fetchText(searchUrl, { headers: variant.headers }, 25000).catch(() => null);
        if (full?.ok) listingIds = extractListingIds(full.text);
      }
      if (listingIds.length > 0) break;
    }

    const targetIds = listingIds.slice(0, sampleSize);
    const detailResults = [];

    for (const id of targetIds) {
      const listingUrl = `https://www.madlan.co.il/listings/${id}`;
      const attempts = [];
      attempts.push(await runAttempt('detail_next_json_minimal', listingUrl, { headers: { 'Accept': 'application/json', 'X-Nextjs-Data': '1', 'Accept-Language': 'he-IL,he;q=0.9' } }));
      await delay(650);
      attempts.push(await runAttempt('detail_iphone_html', listingUrl, { headers: { 'User-Agent': IPHONE_UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'he-IL,he;q=0.9', 'Referer': searchUrl } }));
      await delay(650);
      attempts.push(await runAttempt('detail_android_html', listingUrl, { headers: { 'User-Agent': ANDROID_UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'he-IL,he;q=0.9', 'Referer': searchUrl } }));
      await delay(650);
      attempts.push(await runAttempt('detail_desktop_html', listingUrl, { headers: { 'User-Agent': DESKTOP_UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'he-IL,he;q=0.9', 'Referer': searchUrl } }));
      await delay(650);
      attempts.push(await runAttempt('detail_graphql_poiByIds', 'https://www.madlan.co.il/api2', {
        method: 'POST',
        headers: { 'User-Agent': IPHONE_UA, 'Content-Type': 'application/json', 'Accept': 'application/json', 'Accept-Language': 'he-IL,he;q=0.9', 'Origin': 'https://www.madlan.co.il', 'Referer': listingUrl },
        body: JSON.stringify({ operationName: 'poiByIds', variables: { ids: [id] }, query: `query poiByIds($ids: [ID!]!) { poiByIds(ids: $ids) { id price addressTitle rooms area floor type contactType pocType agencyName amenities __typename } }` }),
      }));

      const successful = attempts.filter((attempt: any) => attempt.success);
      detailResults.push({ id, listingUrl, success_count: successful.length, best_method: (successful[0] as any)?.method || null, attempts });
      await delay(1200);
    }

    const totalAttempted = detailResults.length;
    const totalSuccessfulListings = detailResults.filter(r => r.success_count > 0).length;
    const methodStats: Record<string, { success: number; total: number }> = {};
    for (const result of detailResults) {
      for (const attempt of result.attempts as any[]) {
        const stat = methodStats[attempt.method] || { success: 0, total: 0 };
        stat.total++;
        if (attempt.success) stat.success++;
        methodStats[attempt.method] = stat;
      }
    }

    return new Response(JSON.stringify({
      success: totalAttempted > 0 && totalSuccessfulListings === totalAttempted,
      searchUrl,
      sampleSize,
      listing_ids_found: listingIds.length,
      listing_ids_tested: targetIds,
      summary: {
        total_attempted: totalAttempted,
        total_successful_listings: totalSuccessfulListings,
        success_rate: totalAttempted ? `${totalSuccessfulListings}/${totalAttempted}` : '0/0',
        method_stats: methodStats,
      },
      searchAttempts,
      detailResults,
    }, null, 2), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});