import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/scraping.ts";
import { saveProperty } from "../_shared/property-helpers.ts";
import { parseYad2Markers } from "../_experimental/parser-yad2-nextdata.ts";
import { getYad2NeighborhoodCodes } from "../_shared/neighborhood-codes.ts";
import { yad2CityMap } from "../_shared/url-builders.ts";
import { updatePageStatus, incrementRunStats, checkAndFinalizeRun, isRunStopped } from "../_shared/run-helpers.ts";

/**
 * Edge Function for scraping Yad2 — public JSON feed API.
 *
 * Why this design (changed 2026-06-14):
 *   - Yad2's WAF (Radware/ShieldSquare) now blocks the HTML scrape path on
 *     www.yad2.co.il — both direct fetch AND the Cloudflare Worker proxy now
 *     receive a "ShieldSquare Block" CAPTCHA shell instead of listings. The old
 *     CF-proxy approach silently returned 0 listings while marking runs
 *     "completed" (the block lacked the literal "Radware" string the detector
 *     checked for), so Yad2 quietly produced nothing for days.
 *   - Yad2's public JSON feed API (gw.yad2.co.il/realestate-feed/{rent|forsale}/map)
 *     is NOT IP-blocked from the Edge runtime (same host extract-phone uses) and
 *     returns the listing feed as structured JSON markers — the same shape the
 *     parser already expects. No HTML, no __NEXT_DATA__, no CAPTCHA.
 *
 * Pagination: the map API returns the whole feed for a region/city (or the
 * complete set for a neighborhood) in ONE response. So we fetch everything on
 * the first page and mark the remaining pages of the run done — no per-page
 * chaining. Filters Yad2's URL used to carry (price/rooms) are applied
 * client-side because the map endpoint rejects them.
 */

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";

const GW_HEADERS: Record<string, string> = {
  "User-Agent": IPHONE_UA,
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "he-IL,he;q=0.9",
  "Origin": "https://www.yad2.co.il",
  "Referer": "https://www.yad2.co.il/realestate/rent",
};

const FETCH_TIMEOUT_MS = 20000;
const MAX_FETCH_RETRIES = 3;

// The gw map API requires a `region`. Map Yad2 numeric city codes → region id.
// All current scout configs target Tel Aviv (city 5000 → region 3). Extend this
// map when adding configs for other cities.
const YAD2_CITY_REGION: Record<string, string> = { "5000": "3" };
const DEFAULT_REGION = "3"; // Tel Aviv area

interface FetchResult {
  ok: boolean;
  markers: any[];
  blockedSample?: string;
}

/**
 * Build the gw map API URL(s) for a config.
 *  - Neighborhood-scoped config → one URL per neighborhood (each returns the
 *    complete set for that neighborhood, no 200-marker cap).
 *  - City-wide config → a single city URL (capped at ~200 markers by Yad2;
 *    the newest/highest-priority listings, which is what matters for new inflow).
 */
function buildGwMapUrls(config: any): string[] {
  const seg = config.property_type === "sale" ? "forsale" : "rent";
  const cityHeb = Array.isArray(config.cities) && config.cities.length ? config.cities[0] : null;
  const cityData = cityHeb ? yad2CityMap[cityHeb] : undefined;
  const city = cityData?.city;
  const region = (city && YAD2_CITY_REGION[city]) || DEFAULT_REGION;
  const base = `https://gw.yad2.co.il/realestate-feed/${seg}/map`;

  const build = (extra: Record<string, string>): string => {
    const p = new URLSearchParams();
    p.set("region", region);
    if (city) p.set("city", city);
    for (const k of Object.keys(extra)) p.set(k, extra[k]);
    return `${base}?${p.toString()}`;
  };

  const codes = config.neighborhoods?.length ? getYad2NeighborhoodCodes(config.neighborhoods) : [];
  if (codes.length) {
    const seen = new Set<string>();
    const urls: string[] = [];
    for (const c of codes) {
      if (!c || seen.has(c)) continue;
      seen.add(c);
      urls.push(build({ neighborhood: c }));
    }
    return urls;
  }
  return [build({})];
}

/**
 * Fetch one gw map URL. Returns ok:false (blocked/unreachable) so the caller
 * can mark the page 'blocked' — never silently treat a WAF page as empty.
 */
async function fetchMapMarkers(url: string): Promise<FetchResult> {
  for (let attempt = 1; attempt <= MAX_FETCH_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const t0 = Date.now();
      const resp = await fetch(url, { headers: GW_HEADERS, signal: controller.signal });
      clearTimeout(timeoutId);
      const ct = resp.headers.get("content-type") || "";
      const text = await resp.text();

      if (resp.ok && ct.includes("application/json")) {
        try {
          const json = JSON.parse(text);
          const markers = json?.data?.markers;
          if (Array.isArray(markers)) {
            console.log(`✅ Yad2 map fetched in ${Date.now() - t0}ms: ${markers.length} markers — ${url}`);
            return { ok: true, markers };
          }
          console.warn(`⚠️ Yad2 map: JSON without markers (${text.slice(0, 150)}) — ${url}`);
          return { ok: true, markers: [] };
        } catch (e) {
          console.warn(`⚠️ Yad2 map: JSON parse failed (attempt ${attempt}): ${(e as Error).message}`);
        }
      } else {
        const blocked = /__uzdbm|ShieldSquare|captcha|perfdrive|<html/i.test(text);
        console.warn(`⚠️ Yad2 map fetch attempt ${attempt}: status=${resp.status} ct=${ct} blocked=${blocked} body=${text.slice(0, 120)}`);
        if (attempt === MAX_FETCH_RETRIES) return { ok: false, markers: [], blockedSample: text.slice(0, 200) };
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`⚠️ Yad2 map fetch error (attempt ${attempt}): ${err instanceof Error ? err.message : String(err)}`);
    }
    if (attempt < MAX_FETCH_RETRIES) await new Promise((r) => setTimeout(r, 3000 * attempt));
  }
  return { ok: false, markers: [] };
}

/** Apply the config's numeric filters client-side (the map API rejects them). */
function passesConfigFilters(p: any, config: any): boolean {
  if (config.min_price && p.price != null && p.price < config.min_price) return false;
  if (config.max_price && p.price != null && p.price > config.max_price) return false;
  if (config.min_rooms && p.rooms != null && p.rooms < Number(config.min_rooms)) return false;
  if (config.max_rooms && p.rooms != null && p.rooms > Number(config.max_rooms)) return false;
  if (config.min_size && p.size != null && p.size < config.min_size) return false;
  if (config.max_size && p.size != null && p.size > config.max_size) return false;
  return true;
}

/**
 * Mark every page after `firstPage` as completed (found 0) so the run can
 * finalize — the whole feed was fetched on the first page.
 */
async function markRemainingPagesDone(supabase: any, runId: string, firstPage: number): Promise<void> {
  const { data: run } = await supabase.from("scout_runs").select("page_stats").eq("id", runId).single();
  if (!run?.page_stats) return;
  let changed = false;
  const pageStats = (run.page_stats as any[]).map((p) => {
    if (p.page > firstPage && (p.status === "pending" || p.status === "scraping")) {
      changed = true;
      return { ...p, status: "completed", found: 0, new: 0, duration_ms: 0, error: undefined };
    }
    return p;
  });
  if (changed) await supabase.from("scout_runs").update({ page_stats: pageStats }).eq("id", runId);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const body = await req.json().catch(() => ({}));
  const page = body.page as number | undefined;
  const runId = body.run_id as string | undefined;
  const configId = body.config_id as string | undefined;
  const maxPages = body.max_pages as number | undefined;
  const startPage = body.start_page as number | undefined;

  if (page == null || !runId || !configId) {
    return new Response(JSON.stringify({ success: false, error: "Missing required params: page, run_id, config_id" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const firstPage = startPage ?? 1;
  const pageStartTime = Date.now();
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  console.log(`🟠 scout-yad2-jina (gw-map): page ${page} for run ${runId}`);

  try {
    if (await isRunStopped(supabase, runId)) {
      console.log(`🛑 Run ${runId} was stopped, skipping page ${page}`);
      return json({ success: false, reason: "stopped" });
    }

    const { data: config, error: configError } = await supabase
      .from("scout_configs").select("*").eq("id", configId).single();
    if (configError || !config) throw new Error("Config not found");

    if (config.property_type === "both") {
      const errorMsg = 'property_type "both" is not supported';
      await updatePageStatus(supabase, runId, page, { status: "failed", error: errorMsg, duration_ms: Date.now() - pageStartTime });
      if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, "yad2-jina");
      return json({ success: false, error: errorMsg }, 400);
    }

    // The map API returns the whole feed at once → only the first page works;
    // any later page (if triggered) is a no-op that lets the run finalize.
    if (page !== firstPage) {
      await updatePageStatus(supabase, runId, page, { status: "completed", found: 0, new: 0, duration_ms: 0 });
      if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, "yad2-jina");
      return json({ success: true, page, found: 0, new: 0, note: "feed fetched on first page" });
    }

    await updatePageStatus(supabase, runId, page, { status: "scraping" });

    const gwUrls = buildGwMapUrls(config);
    await updatePageStatus(supabase, runId, page, { url: gwUrls[0] });
    console.log(`🟠 Yad2 page ${page}: ${gwUrls.length} map URL(s) to fetch`);

    const allMarkers: any[] = [];
    const seenTokens = new Set<string>();
    let anyOk = false;
    let lastBlockSample: string | undefined;

    for (const url of gwUrls) {
      const r = await fetchMapMarkers(url);
      if (r.ok) {
        anyOk = true;
        for (const m of r.markers) {
          const t = m?.token;
          if (t && !seenTokens.has(t)) { seenTokens.add(t); allMarkers.push(m); }
        }
      } else {
        lastBlockSample = r.blockedSample;
      }
      if (gwUrls.length > 1) await new Promise((res) => setTimeout(res, 1200));
    }

    // Total failure across every URL → surface it as 'blocked' (visible), not a silent empty.
    if (!anyOk) {
      const duration = Date.now() - pageStartTime;
      console.warn(`⚠️ Yad2 page ${page}: all ${gwUrls.length} map URL(s) blocked/unreachable. Sample: ${lastBlockSample || "n/a"}`);
      await updatePageStatus(supabase, runId, page, { status: "blocked", error: "yad2_map_blocked_or_unreachable", duration_ms: duration });
      await markRemainingPagesDone(supabase, runId, firstPage);
      if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, "yad2-jina");
      return json({ success: false, page, error: "yad2_map_blocked_or_unreachable", duration_ms: duration });
    }

    const parseResult = parseYad2Markers(allMarkers, config.property_type as "rent" | "sale", config.owner_type_filter);
    const properties = parseResult.properties.filter((p) => passesConfigFilters(p, config));
    console.log(`🟠 Yad2 page ${page} | markers=${allMarkers.length} | parsed=${parseResult.properties.length} | afterFilters=${properties.length} | private=${parseResult.stats.private_count} | broker=${parseResult.stats.broker_count}`);

    // Save debug sample (markers JSON, truncated)
    try {
      await supabase.from("debug_scrape_samples").upsert({
        source: "yad2",
        url: gwUrls[0],
        markdown: null,
        html: JSON.stringify(allMarkers).substring(0, 100000),
        properties_found: properties.length,
        updated_at: new Date().toISOString(),
      }, { onConflict: "source" });
    } catch (debugErr) { console.warn("Failed to save debug sample:", debugErr); }

    const SAVE_CONCURRENCY = 5;
    let totalNew = 0;
    for (let i = 0; i < properties.length; i += SAVE_CONCURRENCY) {
      const batch = properties.slice(i, i + SAVE_CONCURRENCY);
      const results = await Promise.all(batch.map((property) => saveProperty(supabase, property)));
      totalNew += results.filter((r) => r.isNew).length;
    }
    const totalFound = properties.length;

    const duration = Date.now() - pageStartTime;
    await updatePageStatus(supabase, runId, page, { status: "completed", found: totalFound, new: totalNew, duration_ms: duration });
    await incrementRunStats(supabase, runId, totalFound, totalNew);
    await markRemainingPagesDone(supabase, runId, firstPage);

    console.log(`✅ Yad2 page ${page}: Done | found=${totalFound} | new=${totalNew} | ${duration}ms`);
    if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, "yad2-jina");

    return json({ success: true, page, found: totalFound, new: totalNew, duration_ms: duration, parser: "gw-map-json" });

  } catch (error) {
    console.error(`scout-yad2-jina page ${page} error:`, error);
    try {
      await updatePageStatus(supabase, runId, page, { status: "failed", error: error instanceof Error ? error.message : "Unknown error", duration_ms: Date.now() - pageStartTime });
      await markRemainingPagesDone(supabase, runId, firstPage);
      if (maxPages) await checkAndFinalizeRun(supabase, runId, maxPages, "yad2-jina");
    } catch (finErr) { console.error("Finalize-after-error failed:", finErr); }
    return json({ success: false, page, error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
