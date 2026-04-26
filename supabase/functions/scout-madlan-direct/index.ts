import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/scraping.ts";
import { buildSinglePageUrl } from "../_shared/url-builders.ts";
import { saveProperty, ScrapedProperty } from "../_shared/property-helpers.ts";
import { updatePageStatus, incrementRunStats, checkAndFinalizeRun, isRunStopped } from "../_shared/run-helpers.ts";

/**
 * Madlan Scout - DIRECT strategy (iPhone UA bypass).
 *
 * Replaces scout-madlan-jina by fetching Madlan directly with an iPhone Safari
 * User-Agent (proven in PoC to bypass Cloudflare without third-party proxy).
 *
 * Flow:
 *   1. Fetch search page (e.g. /for-rent/<city>) -> extract listing IDs
 *   2. For each ID, fetch /listings/<id> -> extract structured data from
 *      __APOLLO_STATE__ / __NEXT_DATA__ / JSON-LD
 *   3. Determine private vs broker (skip brokers per business policy)
 *   4. saveProperty() reuses existing dedup + matching pipeline
 */

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const MADLAN_DIRECT_CONFIG = {
  SOURCE: 'madlan',
  PAGE_DELAY_MS: 6000,         // delay between pages
  RETRY_DELAY_MS: 15000,
  MAX_BLOCK_RETRIES: 2,
  DETAIL_DELAY_MIN_MS: 700,    // jitter delay between detail fetches
  DETAIL_DELAY_MAX_MS: 1400,
  DETAIL_MAX_RETRIES: 2,
  DETAIL_CONCURRENCY: 1,       // serial detail fetches to stay polite
};

// ==================== Fetch helpers ====================

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const jitter = (min: number, max: number) => min + Math.floor(Math.random() * (max - min));

async function fetchHtml(url: string, maxRetries = 2, timeoutMs = 30000): Promise<string | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': IPHONE_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'he-IL,he;q=0.9',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const html = await res.text();
        if (html && html.length > 1000) return html;
        console.warn(`⚠️ Madlan-Direct short response ${html.length} chars from ${url}`);
      } else {
        console.warn(`⚠️ Madlan-Direct attempt ${attempt + 1} HTTP ${res.status} for ${url}`);
        if (res.status === 410 || res.status === 404) return null;
      }
    } catch (err) {
      console.error(`❌ Madlan-Direct fetch attempt ${attempt + 1} for ${url}:`, err);
    }
    if (attempt < maxRetries - 1) await sleep(2500 * (attempt + 1));
  }
  return null;
}

// ==================== Extractors ====================

function extractListingIds(html: string): string[] {
  const ids = new Set<string>();
  const re = /\/listings?\/([a-zA-Z0-9_-]{6,40})/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    // Filter out obvious non-IDs
    if (!/^(undefined|null|search|index)$/i.test(id)) ids.add(id);
  }
  return [...ids];
}

interface DetailData {
  source_id: string;
  source_url: string;
  title?: string;
  price?: number;
  rooms?: number;
  size?: number;
  floor?: number;
  address?: string;
  city?: string;
  neighborhood?: string;
  property_type_raw?: string;
  description?: string;
  images?: string[];
  features: Record<string, boolean>;
  is_private?: boolean | null;
  raw_apollo_keys?: number;
}

function parseApolloOrNextJson(html: string): any | null {
  // Try Apollo state
  const apollo = html.match(/window\.__APOLLO_STATE__\s*=\s*({[\s\S]*?})\s*;?\s*<\/script>/);
  if (apollo) {
    try { return JSON.parse(apollo[1]); } catch { /* fall through */ }
  }
  // Try Next.js data
  const next = html.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (next) {
    try { return JSON.parse(next[1]); } catch { /* fall through */ }
  }
  return null;
}

const HEBREW_FEATURE_MAP: Record<string, string> = {
  'מרפסת': 'balcony', 'מעלית': 'elevator', 'חניה': 'parking', 'חניון': 'parking',
  'ממ״ד': 'mamad', 'ממ"ד': 'mamad', 'מחסן': 'storage', 'גינה': 'yard',
  'נגיש': 'accessible', 'מרוהט': 'furnished', 'ריהוט': 'furnished',
  'מיזוג': 'aircon', 'חיות': 'pets', 'משופץ': 'renovated', 'סורגים': 'bars',
  'דוד שמש': 'sun_water_heater', 'בריכה': 'pool',
};

function findPoiInApollo(apollo: any): any | null {
  if (!apollo || typeof apollo !== 'object') return null;
  // Apollo state keys often look like "Listing:abc123" or "POI:xyz"
  for (const [key, val] of Object.entries(apollo)) {
    if (typeof key === 'string' && /^(Listing|POI|Property|Bulletin):/i.test(key) && val && typeof val === 'object') {
      return val;
    }
  }
  // Next.js shape: props.pageProps.poi or initialData.poi
  const pageProps = apollo?.props?.pageProps;
  if (pageProps?.poi) return pageProps.poi;
  if (pageProps?.initialData?.poi) return pageProps.initialData.poi;
  if (pageProps?.listing) return pageProps.listing;
  return null;
}

function extractDetail(html: string, sourceId: string, sourceUrl: string): DetailData {
  const result: DetailData = { source_id: sourceId, source_url: sourceUrl, features: {} };

  // ----- Apollo / Next.js JSON -----
  const apollo = parseApolloOrNextJson(html);
  result.raw_apollo_keys = apollo ? Object.keys(apollo).length : 0;
  const poi = findPoiInApollo(apollo);

  if (poi && typeof poi === 'object') {
    if (poi.price) result.price = parseInt(String(poi.price).replace(/[^\d]/g, ''));
    if (poi.area || poi.size || poi.squareMeter) {
      const s = parseInt(String(poi.area ?? poi.size ?? poi.squareMeter).replace(/[^\d]/g, ''));
      if (s > 0 && s < 5000) result.size = s;
    }
    if (poi.rooms != null) {
      const r = parseFloat(String(poi.rooms));
      if (r > 0 && r < 25) result.rooms = r;
    }
    if (poi.floor != null && poi.floor !== '') {
      const f = parseInt(String(poi.floor));
      if (!isNaN(f)) result.floor = f;
    }
    if (poi.addressTitle || poi.address || poi.addressString) {
      result.address = String(poi.addressTitle ?? poi.address ?? poi.addressString).trim();
    }
    if (poi.city) result.city = String(poi.city).trim();
    if (poi.neighborhood || poi.neighbourhood || poi.area_name) {
      result.neighborhood = String(poi.neighborhood ?? poi.neighbourhood ?? poi.area_name).trim();
    }
    if (poi.type) result.property_type_raw = String(poi.type);
    if (poi.description) result.description = String(poi.description).slice(0, 5000);
    if (Array.isArray(poi.images)) result.images = poi.images.map((x: any) => typeof x === 'string' ? x : x?.url).filter(Boolean).slice(0, 30);
    else if (Array.isArray(poi.mediaItems)) result.images = poi.mediaItems.map((x: any) => x?.url || x?.src).filter(Boolean).slice(0, 30);

    // POC type (private vs agent)
    const poc = poi.pocType || poi.contactType || poi?.contactInfo?.type;
    if (poc === 'private') result.is_private = true;
    else if (poc === 'agent' || poc === 'broker') result.is_private = false;
    else if (poi?.contactInfo?.agencyName) result.is_private = false;

    // Amenities
    const amenities = poi.amenities || poi.additionalDetails || {};
    const boolMap: Record<string, string> = {
      parking: 'parking', balcony: 'balcony', elevator: 'elevator',
      secureRoom: 'mamad', safeRoom: 'mamad', storage: 'storage',
      garden: 'yard', accessible: 'accessible', furnished: 'furnished',
      airConditioner: 'aircon', airCondition: 'aircon',
      pets: 'pets', renovated: 'renovated', garage: 'garage',
      bars: 'bars', sunHeater: 'sun_water_heater', pool: 'pool',
    };
    for (const [k, fk] of Object.entries(boolMap)) {
      if (amenities[k] === true) result.features[fk] = true;
      else if (amenities[k] === false) result.features[fk] = false;
    }
  }

  // ----- Regex fallbacks (when no Apollo POI matched) -----
  if (!result.price) {
    const m = html.match(/"price"\s*:\s*(\d{4,9})/);
    if (m) result.price = parseInt(m[1]);
  }
  if (!result.rooms) {
    const m = html.match(/"rooms?"\s*:\s*"?(\d+(?:\.\d+)?)"?/);
    if (m) result.rooms = parseFloat(m[1]);
  }
  if (!result.size) {
    const m = html.match(/"(?:area|squareMeter|size)"\s*:\s*(\d{2,5})/);
    if (m) result.size = parseInt(m[1]);
  }
  if (result.floor === undefined) {
    const m = html.match(/"floor"\s*:\s*"?(-?\d+)"?/);
    if (m) result.floor = parseInt(m[1]);
  }
  if (!result.address) {
    const m = html.match(/"address(?:Title|String)?"\s*:\s*"([^"]{3,160})"/);
    if (m) result.address = m[1];
  }
  if (!result.city) {
    const m = html.match(/"city"\s*:\s*"([^"]{2,40})"/);
    if (m) result.city = m[1];
  }

  // ----- Title from <title> -----
  const titleMatch = html.match(/<title>([^<]{0,250})<\/title>/);
  if (titleMatch) result.title = titleMatch[1].replace(/\s*\|.*$/, '').trim();

  // ----- Broker detection from HTML markers -----
  if (result.is_private == null) {
    if (/data-auto="agent-tag"/i.test(html) || /agencyName/i.test(html)) {
      result.is_private = false;
    } else if (/private[_-]?owner|בעלים פרטי|מפרסם פרטי/i.test(html)) {
      result.is_private = true;
    }
  }

  // ----- Hebrew feature scan in description -----
  if (result.description) {
    for (const [heb, fk] of Object.entries(HEBREW_FEATURE_MAP)) {
      if (result.features[fk] === undefined && result.description.includes(heb)) {
        result.features[fk] = true;
      }
    }
  }

  return result;
}

async function fetchDetail(listingId: string): Promise<DetailData | null> {
  const url = `https://www.madlan.co.il/listings/${listingId}`;
  for (let attempt = 0; attempt < MADLAN_DIRECT_CONFIG.DETAIL_MAX_RETRIES; attempt++) {
    const html = await fetchHtml(url, 1, 25000);
    if (!html) {
      if (attempt < MADLAN_DIRECT_CONFIG.DETAIL_MAX_RETRIES - 1) await sleep(2000);
      continue;
    }
    const detail = extractDetail(html, listingId, url);
    // Require at minimum an address or price to be usable
    if (detail.price || detail.address || detail.rooms) return detail;
    console.warn(`⚠️ Detail ${listingId}: no usable fields extracted (apollo_keys=${detail.raw_apollo_keys})`);
  }
  return null;
}

// ==================== Server ====================

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

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
  console.log(`🍎 scout-madlan-direct: Page ${page} for run ${runId}`);

  try {
    if (await isRunStopped(supabase, runId)) {
      console.log(`🛑 Run ${runId} stopped, skipping page ${page}`);
      return new Response(JSON.stringify({ success: false, reason: 'stopped' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: config, error: configError } = await supabase
      .from('scout_configs').select('*').eq('id', configId).single();
    if (configError || !config) throw new Error('Config not found');

    if (config.property_type === 'both') {
      const errorMsg = 'property_type "both" is not supported';
      await updatePageStatus(supabase, runId, page, { status: 'failed', error: errorMsg, duration_ms: Date.now() - pageStartTime });
      if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-direct');
      return new Response(JSON.stringify({ success: false, error: errorMsg }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await updatePageStatus(supabase, runId, page, { status: 'scraping' });

    const urls = buildSinglePageUrl(config, page);
    if (!urls.length) {
      await updatePageStatus(supabase, runId, page, { status: 'failed', error: 'Failed to build URL', duration_ms: Date.now() - pageStartTime });
      if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-direct');
      return new Response(JSON.stringify({ success: false, error: 'No URL' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let totalFound = 0;
    let totalNew = 0;
    let urlsFailed = 0;
    let totalSkippedBroker = 0;

    await updatePageStatus(supabase, runId, page, { url: urls[0] });

    for (const searchUrl of urls) {
      console.log(`🍎 Madlan-Direct page ${page}: ${searchUrl}`);

      const searchHtml = await fetchHtml(searchUrl, 2, 35000);
      if (!searchHtml) { urlsFailed++; continue; }

      const ids = extractListingIds(searchHtml);
      console.log(`🍎 Madlan-Direct page ${page}: extracted ${ids.length} listing IDs`);

      if (ids.length === 0) { urlsFailed++; continue; }

      // Save debug sample
      try {
        await supabase.from('debug_scrape_samples').upsert({
          source: 'madlan', url: searchUrl, html: null,
          markdown: searchHtml.substring(0, 100000),
          properties_found: ids.length, updated_at: new Date().toISOString()
        }, { onConflict: 'source' });
      } catch { /* non-fatal */ }

      // Fetch each listing detail with polite delay
      for (const id of ids) {
        if (await isRunStopped(supabase, runId)) {
          console.log(`🛑 Run ${runId} stopped mid-page`);
          break;
        }

        await sleep(jitter(MADLAN_DIRECT_CONFIG.DETAIL_DELAY_MIN_MS, MADLAN_DIRECT_CONFIG.DETAIL_DELAY_MAX_MS));
        const detail = await fetchDetail(id);
        if (!detail) continue;

        // Apply broker filter (config.owner_type_filter: 'private' | 'all' | undefined)
        const ownerFilter = (config as any).owner_type_filter;
        if (ownerFilter === 'private' && detail.is_private === false) {
          totalSkippedBroker++;
          continue;
        }

        const property: ScrapedProperty = {
          source: MADLAN_DIRECT_CONFIG.SOURCE,
          source_url: detail.source_url,
          source_id: detail.source_id,
          title: detail.title,
          city: detail.city,
          neighborhood: detail.neighborhood,
          address: detail.address,
          price: detail.price,
          rooms: detail.rooms,
          size: detail.size,
          floor: detail.floor,
          property_type: config.property_type as 'rent' | 'sale',
          description: detail.description,
          images: detail.images,
          features: detail.features,
          is_private: detail.is_private ?? null,
          raw_data: { scanner: 'direct-iphone-ua', apollo_keys: detail.raw_apollo_keys },
        };

        try {
          const saveResult = await saveProperty(supabase, property);
          totalFound++;
          if (saveResult.isNew) totalNew++;
        } catch (err) {
          console.error(`❌ saveProperty failed for ${id}:`, err);
        }
      }
    }

    const duration = Date.now() - pageStartTime;

    if (totalFound === 0 && urlsFailed === urls.length) {
      const { data: runData } = await supabase.from('scout_runs').select('page_stats').eq('id', runId).single();
      const currentRetryCount = runData?.page_stats?.find((p: any) => p.page === page)?.retry_count || 0;
      await updatePageStatus(supabase, runId, page, { status: 'blocked', error: 'all_urls_failed_or_blocked', duration_ms: duration, retry_count: isRetry ? currentRetryCount : 0 });
      await chainNextPage(supabaseUrl, supabaseServiceKey, supabase, configId, page, runId, maxPages!, startPage, isRetry, retryPages);
      return new Response(JSON.stringify({ success: false, page, error: 'all_urls_failed_or_blocked', duration_ms: duration }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await updatePageStatus(supabase, runId, page, { status: 'completed', found: totalFound, new: totalNew, duration_ms: duration });
    await incrementRunStats(supabase, runId, totalFound, totalNew);

    console.log(`✅ Madlan-Direct page ${page}: found=${totalFound} new=${totalNew} skipped_broker=${totalSkippedBroker} ${duration}ms`);
    await chainNextPage(supabaseUrl, supabaseServiceKey, supabase, configId, page, runId, maxPages!, startPage, isRetry, retryPages);

    return new Response(JSON.stringify({
      success: true, page, found: totalFound, new: totalNew, skipped_broker: totalSkippedBroker,
      duration_ms: duration, parser: 'direct-iphone-ua'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error(`scout-madlan-direct page ${page} error:`, error);
    await updatePageStatus(supabase, runId, page, { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error', duration_ms: Date.now() - pageStartTime });
    if (maxPages) await chainNextPage(supabaseUrl, supabaseServiceKey, createClient(supabaseUrl, supabaseServiceKey), configId!, page, runId, maxPages, startPage, isRetry, retryPages);
    return new Response(JSON.stringify({ success: false, page, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ==================== Chaining ====================

async function chainNextPage(
  supabaseUrl: string, supabaseKey: string, supabase: any,
  configId: string, currentPage: number, runId: string, maxPages: number,
  startPage?: number, isRetry?: boolean, retryPages?: number[]
): Promise<void> {
  if (isRetry && retryPages?.length) {
    const idx = retryPages.indexOf(currentPage);
    if (idx >= 0 && idx < retryPages.length - 1) {
      await triggerNextPage(supabaseUrl, supabaseKey, configId, retryPages[idx + 1], runId, maxPages, startPage, true, retryPages);
    } else {
      await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-direct');
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
  const delay = isRetry ? MADLAN_DIRECT_CONFIG.RETRY_DELAY_MS : MADLAN_DIRECT_CONFIG.PAGE_DELAY_MS;

  console.log(`⏳ Waiting ${delay / 1000}s before page ${nextPage}${isRetry ? ' (retry)' : ''}...`);
  await sleep(delay);

  const supabase = createClient(supabaseUrl, supabaseKey);
  if (await isRunStopped(supabase, runId)) {
    console.log(`🛑 Run ${runId} stopped, skipping page ${nextPage}`);
    return;
  }

  let triggered = false;
  for (let attempt = 1; attempt <= MAX_TRIGGER_RETRIES; attempt++) {
    try {
      console.log(`📄 Madlan-Direct: triggering page ${nextPage} (attempt ${attempt})`);
      await fetch(`${supabaseUrl}/functions/v1/scout-madlan-direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({ config_id: configId, page: nextPage, run_id: runId, max_pages: maxPages, start_page: startPage, is_retry: isRetry, retry_pages: retryPages })
      });
      triggered = true;
      break;
    } catch (err) {
      console.error(`❌ Failed to trigger page ${nextPage} (attempt ${attempt}):`, err);
      if (attempt < MAX_TRIGGER_RETRIES) await sleep(TRIGGER_RETRY_DELAY);
    }
  }

  if (!triggered) {
    if (_skipCount < MAX_CONSECUTIVE_SKIPS) {
      await updatePageStatus(supabase, runId, nextPage, { status: 'failed', error: 'trigger_failed', duration_ms: 0 });
      if (isRetry && retryPages?.length) {
        const idx = retryPages.indexOf(nextPage);
        if (idx >= 0 && idx < retryPages.length - 1) {
          await triggerNextPage(supabaseUrl, supabaseKey, configId, retryPages[idx + 1], runId, maxPages, startPage, true, retryPages, _skipCount + 1);
        } else { await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-direct'); }
      } else if (nextPage < maxPages) {
        await triggerNextPage(supabaseUrl, supabaseKey, configId, nextPage + 1, runId, maxPages, startPage, false, undefined, _skipCount + 1);
      } else { await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-direct'); }
    } else { await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-direct'); }
  }
}

async function handleRetryOrFinalize(
  supabase: any, supabaseUrl: string, supabaseKey: string,
  runId: string, maxPages: number, configId: string, startPage?: number
): Promise<void> {
  const { data: run } = await supabase.from('scout_runs').select('page_stats').eq('id', runId).single();
  if (!run?.page_stats) { await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-direct'); return; }

  const blockedPages = (run.page_stats as any[]).filter(
    (p: any) => p.status === 'blocked' && (p.retry_count || 0) < MADLAN_DIRECT_CONFIG.MAX_BLOCK_RETRIES
  );

  if (blockedPages.length === 0) { await checkAndFinalizeRun(supabase, runId, maxPages, 'madlan-direct'); return; }

  console.log(`🔄 Retrying ${blockedPages.length} blocked pages for run ${runId}`);
  const updatedStats = (run.page_stats as any[]).map((p: any) => {
    if (p.status === 'blocked' && (p.retry_count || 0) < MADLAN_DIRECT_CONFIG.MAX_BLOCK_RETRIES) {
      return { ...p, status: 'pending', error: undefined, retry_count: (p.retry_count || 0) + 1 };
    }
    return p;
  });
  await supabase.from('scout_runs').update({ page_stats: updatedStats }).eq('id', runId);

  const retryPageNumbers = blockedPages.map((p: any) => p.page);
  await triggerNextPage(supabaseUrl, supabaseKey, configId, retryPageNumbers[0], runId, maxPages, startPage, true, retryPageNumbers);
}
