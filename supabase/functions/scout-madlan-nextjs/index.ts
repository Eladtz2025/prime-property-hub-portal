import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/scraping.ts";
import { buildSinglePageUrl } from "../_shared/url-builders.ts";
import { saveProperty } from "../_shared/property-helpers.ts";
import { updatePageStatus, incrementRunStats, checkAndFinalizeRun, isRunStopped } from "../_shared/run-helpers.ts";

/**
 * Madlan Scout — Next.js __NEXT_DATA__ strategy.
 *
 * Strategy (per developer brief):
 *   1. GET search page with MINIMAL headers only:
 *        Accept: text/html
 *        X-Nextjs-Data: 1
 *        Accept-Language: he-IL,he;q=0.9
 *      No User-Agent / Referer / Origin (those triggered Madlan's Cloudflare blocks).
 *   2. Extract <script id="__NEXT_DATA__">{...}</script> from HTML.
 *   3. Walk the JSON to the POIs array and save each property via saveProperty().
 *
 * Same proven technique used in _shared/madlan-detail-parser.ts (~88% success on detail pages).
 * Zero external dependencies, no API keys.
 */

const MADLAN_CONFIG = {
  SOURCE: 'madlan',
  MAX_RETRIES: 2,
  PAGE_DELAY_MS: 8000,
  RETRY_DELAY_MS: 20000,
  MAX_BLOCK_RETRIES: 2,
  REQUEST_TIMEOUT_MS: 30000,
};

interface FetchResult {
  html: string;
  status: number;
}

/**
 * Fetch search page HTML via Cloudflare Worker proxy (bypasses Supabase IP block).
 * Falls back to direct fetch if proxy is not configured or fails hard.
 */
const CF_WORKER_URL = 'https://yad2-proxy.taylor-kelly88.workers.dev/';

async function fetchMadlanSearchPage(url: string, attempt: number): Promise<FetchResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MADLAN_CONFIG.REQUEST_TIMEOUT_MS);
  const proxyKey = Deno.env.get('YAD2_PROXY_KEY');

  try {
    console.log(`🌐 Madlan-NextJS attempt ${attempt + 1}/${MADLAN_CONFIG.MAX_RETRIES} — fetching via CF Worker: ${url}`);

    let response: Response;
    if (proxyKey) {
      // Route through Cloudflare Worker — different egress IP, bypasses Madlan's Supabase block.
      response = await fetch(CF_WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-proxy-key': proxyKey,
        },
        body: JSON.stringify({
          url,
          target: 'madlan',
          headers: {
            'Accept': 'text/html',
            'X-Nextjs-Data': '1',
            'Accept-Language': 'he-IL,he;q=0.9',
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`⚠️ CF Worker returned HTTP ${response.status}`);
        return { html: await response.text(), status: response.status };
      }

      const data = await response.json();
      const html = String(data.html || '');
      const upstreamStatus = Number(data.status || 0);
      console.log(`✅ Madlan-NextJS via CF Worker: upstream=${upstreamStatus}, html=${html.length} chars`);
      return { html, status: upstreamStatus || 200 };
    }

    // Fallback: direct fetch (will likely be blocked, but kept for safety).
    console.warn(`⚠️ YAD2_PROXY_KEY not set — falling back to direct fetch (likely blocked).`);
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
        'X-Nextjs-Data': '1',
        'Accept-Language': 'he-IL,he;q=0.9',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const html = await response.text();

    if (!response.ok) {
      console.warn(`⚠️ Madlan-NextJS attempt ${attempt + 1}: HTTP ${response.status} (${html.length} chars)`);
      return { html, status: response.status };
    }

    if (html.length < 500) {
      console.warn(`⚠️ Madlan-NextJS attempt ${attempt + 1}: short response (${html.length} chars)`);
      return null;
    }

    console.log(`✅ Madlan-NextJS attempt ${attempt + 1}: ${html.length} chars (HTTP ${response.status})`);
    return { html, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`⏱️ Madlan-NextJS attempt ${attempt + 1}: timeout`);
    } else {
      console.error(`❌ Madlan-NextJS attempt ${attempt + 1}:`, error);
    }
    return null;
  }
}

/**
 * Detect Cloudflare challenge / block pages.
 */
function isCloudflareChallenge(html: string, status: number): boolean {
  if (status === 403 || status === 503) return true;
  const lower = html.toLowerCase();
  if (lower.includes('cf-chl-bypass') || lower.includes('checking your browser')) return true;
  if (lower.includes('attention required') && lower.includes('cloudflare')) return true;
  return false;
}

/**
 * Extract the __NEXT_DATA__ JSON blob from a Madlan HTML page.
 */
function extractNextData(html: string): any | null {
  const marker = '<script id="__NEXT_DATA__"';
  const startIdx = html.indexOf(marker);
  if (startIdx < 0) {
    console.warn(`⚠️ __NEXT_DATA__ marker not found in HTML`);
    return null;
  }
  const tagOpen = html.indexOf('>', startIdx);
  if (tagOpen < 0) return null;
  const scriptClose = html.indexOf('</script>', tagOpen);
  if (scriptClose < 0) return null;
  const jsonStr = html.substring(tagOpen + 1, scriptClose).trim();
  if (jsonStr.length < 10) return null;
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn(`⚠️ Failed to JSON.parse __NEXT_DATA__ (${jsonStr.length} chars):`, e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Recursively search for an array of property POIs inside the Next.js page data.
 * Madlan typically nests the list under pageProps -> initialState -> searchPois -> data
 * or pageProps -> data -> poiList. Structure can vary, so we walk the tree.
 */
function findPoiArray(node: any, depth = 0): any[] | null {
  if (!node || depth > 10) return null;

  // Common explicit paths first
  const candidates: any[] = [
    node?.props?.pageProps?.poiList,
    node?.props?.pageProps?.searchPois?.data,
    node?.props?.pageProps?.initialState?.searchPois?.data,
    node?.props?.pageProps?.data?.poiList,
    node?.props?.pageProps?.dehydratedState?.queries,
    node?.pageProps?.poiList,
    node?.pageProps?.searchPois?.data,
    node?.pageProps?.initialState?.searchPois?.data,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0 && looksLikePoi(c[0])) return c;
  }

  // Generic walk
  if (Array.isArray(node)) {
    if (node.length > 0 && looksLikePoi(node[0])) return node;
    for (const item of node) {
      const found = findPoiArray(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof node === 'object') {
    for (const key of Object.keys(node)) {
      const found = findPoiArray(node[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function looksLikePoi(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  // A POI typically has an id and at least one of: price, rooms, address, city
  const hasId = typeof item.id === 'string' || typeof item.id === 'number';
  if (!hasId) return false;
  const fieldsToCheck = ['price', 'rooms', 'address', 'city', 'beds', 'area', 'addressTitle', 'neighborhood'];
  return fieldsToCheck.some(f => item[f] !== undefined);
}

interface PoiRaw {
  id?: string | number;
  price?: number | string;
  rooms?: number | string;
  beds?: number | string;
  area?: number | string;
  size?: number | string;
  floor?: number | string;
  address?: string;
  addressTitle?: string;
  street?: string;
  city?: string;
  cityName?: string;
  neighborhood?: string;
  neighborhoodName?: string;
  pocType?: string;
  contactType?: string;
  type?: string;
  images?: any[];
}

function toNum(v: any): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function buildAddress(poi: PoiRaw): string | null {
  const parts: string[] = [];
  if (poi.street) parts.push(String(poi.street));
  if (poi.address && !parts.includes(String(poi.address))) parts.push(String(poi.address));
  if (poi.addressTitle && !parts.length) parts.push(String(poi.addressTitle));
  return parts.length ? parts.join(' ').trim() : null;
}

function detectIsPrivate(poi: PoiRaw): boolean | null {
  const t = (poi.pocType || poi.contactType || '').toString().toLowerCase();
  if (t === 'private') return true;
  if (t === 'agent' || t === 'broker' || t === 'office') return false;
  return null;
}

/**
 * Map a raw POI from Madlan's __NEXT_DATA__ to our ParsedProperty shape.
 */
function mapPoiToProperty(poi: PoiRaw, propertyType: 'rent' | 'sale'): any | null {
  if (!poi.id) return null;
  const id = String(poi.id);

  const sourceUrl = `https://www.madlan.co.il/listings/${id}`;

  const price = toNum(poi.price);
  const rooms = toNum(poi.rooms ?? poi.beds);
  const size = toNum(poi.area ?? poi.size);
  const floor = poi.floor !== undefined ? toNum(poi.floor) : null;
  const address = buildAddress(poi);
  const city = (poi.city || poi.cityName || '').toString() || 'תל אביב יפו';
  const neighborhood = (poi.neighborhood || poi.neighborhoodName || '').toString() || null;

  return {
    source: 'madlan',
    source_id: id,
    source_url: sourceUrl,
    title: address ? `${address}, ${city}` : null,
    city,
    neighborhood,
    neighborhood_value: neighborhood,
    address,
    price: price !== null ? Math.round(price) : null,
    rooms,
    size: size !== null ? Math.round(size) : null,
    floor: floor !== null ? Math.round(floor) : null,
    property_type: propertyType,
    is_private: detectIsPrivate(poi),
    entry_date: null,
    features: {},
    raw_data: poi,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const body = await req.json().catch(() => ({}));
  const page = body.page as number | undefined;
  const runId = body.run_id as string | undefined;
  const configId = body.config_id as string | undefined;
  const maxPages = body.max_pages as number | undefined;
  const startPage = body.start_page as number | undefined;
  const isRetry = body.is_retry as boolean | undefined;
  const retryPages = body.retry_pages as number[] | undefined;

  if (page == null || !runId || !configId) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required params: page, run_id, config_id' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const pageStartTime = Date.now();
  console.log(`🟠 scout-madlan-nextjs: Page ${page} for run ${runId}`);

  try {
    if (await isRunStopped(supabase, runId)) {
      console.log(`🛑 Run ${runId} was stopped, skipping page ${page}`);
      return new Response(JSON.stringify({ success: false, reason: 'stopped' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: config, error: configError } = await supabase
      .from('scout_configs').select('*').eq('id', configId).single();
    if (configError || !config) throw new Error('Config not found');

    await updatePageStatus(supabase, runId, page, { status: 'scraping' });

    const urls = buildSinglePageUrl(config, page);
    if (!urls.length) {
      await updatePageStatus(supabase, runId, page, { status: 'failed', error: 'Failed to build URL', duration_ms: Date.now() - pageStartTime });
      if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-nextjs');
      return new Response(JSON.stringify({ success: false, error: 'No URL' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (config.property_type === 'both') {
      const errorMsg = 'property_type "both" is not supported';
      await updatePageStatus(supabase, runId, page, { status: 'failed', error: errorMsg, duration_ms: Date.now() - pageStartTime });
      if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-nextjs');
      return new Response(JSON.stringify({ success: false, error: errorMsg }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let totalFound = 0;
    let totalNew = 0;
    let urlsFailed = 0;
    let blockedByCf = false;

    console.log(`🟠 Madlan-NextJS page ${page}: ${urls.length} URL(s) to scrape`);
    await updatePageStatus(supabase, runId, page, { url: urls[0] });

    for (const url of urls) {
      console.log(`🟠 Madlan-NextJS page ${page}: ${url}`);

      let result: FetchResult | null = null;
      let cfBlocked = false;

      for (let attempt = 0; attempt < MADLAN_CONFIG.MAX_RETRIES; attempt++) {
        result = await fetchMadlanSearchPage(url, attempt);
        if (!result) {
          if (attempt < MADLAN_CONFIG.MAX_RETRIES - 1) {
            await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
          }
          continue;
        }

        if (isCloudflareChallenge(result.html, result.status)) {
          console.warn(`⚠️ Madlan-NextJS page ${page}: Cloudflare challenge detected (HTTP ${result.status})`);
          cfBlocked = true;
          if (attempt < MADLAN_CONFIG.MAX_RETRIES - 1) {
            console.log(`⏳ Backing off 20s before retry...`);
            await new Promise(r => setTimeout(r, MADLAN_CONFIG.RETRY_DELAY_MS));
          }
          continue;
        }

        cfBlocked = false;
        break;
      }

      if (!result || cfBlocked) {
        console.warn(`⚠️ Madlan-NextJS page ${page}: ${cfBlocked ? 'CF blocked' : 'fetch failed'} for ${url}`);
        if (cfBlocked) blockedByCf = true;
        urlsFailed++;
        continue;
      }

      const nextData = extractNextData(result.html);
      if (!nextData) {
        console.warn(`⚠️ Madlan-NextJS page ${page}: No __NEXT_DATA__ extracted (HTML ${result.html.length} chars)`);
        urlsFailed++;
        // Save a debug sample for postmortem
        try {
          await supabase.from('debug_scrape_samples').upsert({
            source: 'madlan',
            url,
            html: result.html.substring(0, 100000),
            markdown: null,
            properties_found: 0,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'source' });
        } catch (_) { /* ignore */ }
        continue;
      }

      const pois = findPoiArray(nextData);
      if (!pois || pois.length === 0) {
        console.warn(`⚠️ Madlan-NextJS page ${page}: No POI array found in __NEXT_DATA__. Top-level keys: ${Object.keys(nextData?.props?.pageProps || {}).join(',')}`);
        // Save full nextData snapshot as debug sample for structure inspection (truncated)
        try {
          const snapshot = JSON.stringify(nextData).substring(0, 100000);
          await supabase.from('debug_scrape_samples').upsert({
            source: 'madlan',
            url,
            html: snapshot,
            markdown: null,
            properties_found: 0,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'source' });
        } catch (_) { /* ignore */ }
        urlsFailed++;
        continue;
      }

      console.log(`🟠 Madlan-NextJS page ${page}: extracted ${pois.length} POIs from __NEXT_DATA__`);

      const propertyType = config.property_type as 'rent' | 'sale';
      const ownerTypeFilter = config.owner_type_filter as 'private' | 'broker' | null | undefined;

      const properties = pois
        .map((p: any) => mapPoiToProperty(p, propertyType))
        .filter((p: any) => p !== null)
        .filter((p: any) => {
          if (ownerTypeFilter === 'private' && p.is_private !== true) return false;
          if (ownerTypeFilter === 'broker' && p.is_private !== false) return false;
          return true;
        });

      console.log(`🟠 Madlan-NextJS page ${page}: ${properties.length} properties after filter`);

      const SAVE_CONCURRENCY = 5;
      let urlNew = 0;
      for (let i = 0; i < properties.length; i += SAVE_CONCURRENCY) {
        const batch = properties.slice(i, i + SAVE_CONCURRENCY);
        const results = await Promise.all(batch.map((p: any) => saveProperty(supabase, p)));
        urlNew += results.filter((r: any) => r.isNew).length;
      }

      totalFound += properties.length;
      totalNew += urlNew;
    }

    const duration = Date.now() - pageStartTime;

    if (totalFound === 0 && urlsFailed === urls.length) {
      const { data: runData } = await supabase.from('scout_runs').select('page_stats').eq('id', runId).single();
      const currentRetryCount = runData?.page_stats?.find((p: any) => p.page === page)?.retry_count || 0;
      const errorReason = blockedByCf ? 'cloudflare_blocked' : 'all_urls_failed';
      await updatePageStatus(supabase, runId, page, { status: 'blocked', error: errorReason, duration_ms: duration, retry_count: isRetry ? currentRetryCount : 0 });
      await chainNextPage(supabaseUrl, supabaseServiceKey, supabase, configId, page, runId, maxPages!, startPage, isRetry, retryPages);
      return new Response(JSON.stringify({ success: false, page, error: errorReason, duration_ms: duration }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await updatePageStatus(supabase, runId, page, { status: 'completed', found: totalFound, new: totalNew, duration_ms: duration });
    await incrementRunStats(supabase, runId, totalFound, totalNew);

    console.log(`✅ Madlan-NextJS page ${page}: Done | found=${totalFound} | new=${totalNew} | ${duration}ms`);
    await chainNextPage(supabaseUrl, supabaseServiceKey, supabase, configId, page, runId, maxPages!, startPage, isRetry, retryPages);

    return new Response(JSON.stringify({ success: true, page, found: totalFound, new: totalNew, duration_ms: duration, parser: 'nextjs-json' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`scout-madlan-nextjs page ${page} error:`, error);
    await updatePageStatus(supabase, runId, page, { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error', duration_ms: Date.now() - pageStartTime });
    if (maxPages) await chainNextPage(supabaseUrl, supabaseServiceKey, createClient(supabaseUrl, supabaseServiceKey), configId!, page, runId, maxPages, startPage, isRetry, retryPages);
    return new Response(JSON.stringify({ success: false, page, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function chainNextPage(
  supabaseUrl: string, supabaseKey: string, supabase: any,
  configId: string, currentPage: number, runId: string, maxPages: number,
  startPage?: number, isRetry?: boolean, retryPages?: number[]
): Promise<void> {
  if (isRetry && retryPages?.length) {
    const currentIdx = retryPages.indexOf(currentPage);
    if (currentIdx >= 0 && currentIdx < retryPages.length - 1) {
      await triggerNextPage(supabaseUrl, supabaseKey, configId, retryPages[currentIdx + 1], runId, maxPages, startPage, true, retryPages);
    } else {
      await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-nextjs');
    }
  } else if (currentPage < maxPages) {
    await triggerNextPage(supabaseUrl, supabaseKey, configId, currentPage + 1, runId, maxPages, startPage);
  } else {
    await handleRetryOrFinalize(supabase, supabaseUrl, supabaseKey, runId, maxPages, configId, startPage);
  }
}

async function triggerNextPage(
  supabaseUrl: string, supabaseKey: string, configId: string,
  nextPage: number, runId: string, maxPages: number,
  startPage?: number, isRetry = false, retryPages?: number[],
  _skipCount: number = 0
): Promise<void> {
  const MAX_TRIGGER_RETRIES = 3;
  const TRIGGER_RETRY_DELAY = 5000;
  const MAX_CONSECUTIVE_SKIPS = 3;
  const delay = isRetry ? MADLAN_CONFIG.RETRY_DELAY_MS : MADLAN_CONFIG.PAGE_DELAY_MS;

  console.log(`⏳ Waiting ${delay / 1000}s before page ${nextPage}${isRetry ? ' (retry)' : ''}...`);
  await new Promise(r => setTimeout(r, delay));

  const supabase = createClient(supabaseUrl, supabaseKey);
  if (await isRunStopped(supabase, runId)) {
    console.log(`🛑 Run ${runId} stopped, skipping page ${nextPage}`);
    return;
  }

  let triggered = false;
  for (let attempt = 1; attempt <= MAX_TRIGGER_RETRIES; attempt++) {
    try {
      console.log(`📄 Madlan-NextJS: triggering page ${nextPage} (attempt ${attempt})`);
      await fetch(`${supabaseUrl}/functions/v1/scout-madlan-nextjs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({ config_id: configId, page: nextPage, run_id: runId, max_pages: maxPages, start_page: startPage, is_retry: isRetry, retry_pages: retryPages })
      });
      triggered = true;
      break;
    } catch (err) {
      console.error(`❌ Failed to trigger page ${nextPage} (attempt ${attempt}):`, err);
      if (attempt < MAX_TRIGGER_RETRIES) await new Promise(r => setTimeout(r, TRIGGER_RETRY_DELAY));
    }
  }

  if (!triggered) {
    if (_skipCount < MAX_CONSECUTIVE_SKIPS) {
      await updatePageStatus(supabase, runId, nextPage, { status: 'failed', error: `trigger_failed`, duration_ms: 0 });
      if (isRetry && retryPages?.length) {
        const currentIdx = retryPages.indexOf(nextPage);
        if (currentIdx >= 0 && currentIdx < retryPages.length - 1) {
          await triggerNextPage(supabaseUrl, supabaseKey, configId, retryPages[currentIdx + 1], runId, maxPages, startPage, true, retryPages, _skipCount + 1);
        } else { await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-nextjs'); }
      } else if (nextPage < maxPages) {
        await triggerNextPage(supabaseUrl, supabaseKey, configId, nextPage + 1, runId, maxPages, startPage, false, undefined, _skipCount + 1);
      } else { await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-nextjs'); }
    } else { await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-nextjs'); }
  }
}

async function handleRetryOrFinalize(
  supabase: any, supabaseUrl: string, supabaseKey: string,
  runId: string, maxPages: number, configId: string, startPage?: number
): Promise<void> {
  const { data: run } = await supabase.from('scout_runs').select('page_stats').eq('id', runId).single();
  if (!run?.page_stats) { await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-nextjs'); return; }

  const blockedPages = (run.page_stats as any[]).filter(
    (p: any) => p.status === 'blocked' && (p.retry_count || 0) < MADLAN_CONFIG.MAX_BLOCK_RETRIES
  );

  if (blockedPages.length === 0) { await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-nextjs'); return; }

  console.log(`🔄 Retrying ${blockedPages.length} blocked pages for run ${runId}`);
  const updatedStats = (run.page_stats as any[]).map((p: any) => {
    if (p.status === 'blocked' && (p.retry_count || 0) < MADLAN_CONFIG.MAX_BLOCK_RETRIES) {
      return { ...p, status: 'pending', error: undefined, retry_count: (p.retry_count || 0) + 1 };
    }
    return p;
  });
  await supabase.from('scout_runs').update({ page_stats: updatedStats }).eq('id', runId);

  const retryPageNumbers = blockedPages.map((p: any) => p.page);
  await triggerNextPage(supabaseUrl, supabaseKey, configId, retryPageNumbers[0], runId, maxPages, startPage, true, retryPageNumbers);
}
