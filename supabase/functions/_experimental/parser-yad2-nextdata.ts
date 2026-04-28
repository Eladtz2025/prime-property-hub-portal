/**
 * Yad2 __NEXT_DATA__ Parser
 *
 * Parses Yad2 listing pages by extracting the structured JSON embedded in
 * <script id="__NEXT_DATA__">. This is dramatically more reliable than the
 * markdown parser because:
 *   - All fields are typed and labeled (no Hebrew regex guessing)
 *   - Address is split into street/houseNumber/neighborhood/city
 *   - is_private is determined by adType ('private' vs 'broker')
 *   - Returns ALL listings on the page, including platinum/commercial
 *
 * Source: served by the Cloudflare Worker proxy (yad2-proxy) — Yad2's
 * Cloudflare WAF blocks Supabase Edge IPs directly.
 */

import type { ParsedProperty, ParserResult, PropertyFeatures } from './parser-utils.ts';

interface Yad2FeedItem {
  token?: string;
  adType?: 'private' | 'broker' | string;
  price?: number;
  subcategoryId?: number;
  categoryId?: number;
  additionalDetails?: {
    roomsCount?: number;
    squareMeter?: number;
    propertyCondition?: { id?: number; text?: string };
  };
  address?: {
    city?: { id?: number; text?: string };
    neighborhood?: { id?: number; text?: string };
    street?: { id?: number; text?: string };
    house?: { number?: number; floor?: number };
  };
  customer?: {
    agencyName?: string;
    isAgency?: boolean;
    agencyId?: number;
  };
  metaData?: {
    coverImage?: string;
    images?: string[];
    video?: string;
  };
  tags?: Array<{ id?: number; name?: string }>;
}

/**
 * Build the canonical Yad2 listing URL from a token.
 * Yad2 uses /realestate/item/{token} as the public detail URL.
 */
function buildYad2Url(token: string): string {
  return `https://www.yad2.co.il/realestate/item/${token}`;
}

/**
 * Compose a human-readable title from structured fields.
 */
function buildTitle(item: Yad2FeedItem, propertyType: 'rent' | 'sale'): string | null {
  const rooms = item.additionalDetails?.roomsCount;
  const hood = item.address?.neighborhood?.text;
  const city = item.address?.city?.text;
  const action = propertyType === 'rent' ? 'להשכרה' : 'למכירה';
  if (rooms && hood && city) return `דירה ${rooms} חדרים ${action} ב${hood}, ${city}`;
  if (rooms && city) return `דירה ${rooms} חדרים ${action} ב${city}`;
  if (hood && city) return `דירה ${action} ב${hood}, ${city}`;
  return null;
}

/**
 * Compose a clean address string from street + house number.
 * Returns null if street is missing or looks invalid.
 */
function buildAddress(item: Yad2FeedItem): string | null {
  const street = item.address?.street?.text?.trim();
  const num = item.address?.house?.number;
  if (!street || street.length < 2) return null;
  // Hebrew letters check
  if (!/[\u0590-\u05FF]/.test(street)) return null;
  if (typeof num === 'number' && num > 0) return `${street} ${num}`;
  return street;
}

/**
 * Determine is_private from adType.
 *  - 'private' → true
 *  - 'broker' → false
 *  - anything else / agency markers → false
 *  - missing → null (unknown, will be enriched later)
 */
function detectIsPrivate(item: Yad2FeedItem): boolean | null {
  const adType = (item.adType || '').toLowerCase();
  if (adType === 'private') {
    // Sanity: even when marked private, an agencyName signals broker
    if (item.customer?.isAgency === true) return false;
    if (item.customer?.agencyName && item.customer.agencyName.length > 1) return false;
    return true;
  }
  if (adType === 'broker' || adType === 'agency') return false;
  if (item.customer?.isAgency === true) return false;
  if (item.customer?.agencyName && item.customer.agencyName.length > 1) return false;
  return null;
}

/**
 * Extract the feed array from the parsed __NEXT_DATA__ object.
 * Yad2 stores listings inside dehydratedState.queries[*].state.data with
 * keys: private, commercial, platinum, king (sometimes).
 */
function extractFeedItems(nextData: any): Yad2FeedItem[] {
  const queries: any[] = nextData?.props?.pageProps?.dehydratedState?.queries || [];
  const items: Yad2FeedItem[] = [];
  for (const q of queries) {
    const d = q?.state?.data;
    if (!d || typeof d !== 'object') continue;
    if (Array.isArray(d.private)) items.push(...d.private);
    if (Array.isArray(d.commercial)) items.push(...d.commercial);
    if (Array.isArray(d.platinum)) items.push(...d.platinum);
    if (Array.isArray(d.king)) items.push(...d.king);
    if (Array.isArray(d.yad1)) items.push(...d.yad1);
  }
  // Deduplicate by token
  const seen = new Set<string>();
  return items.filter(i => {
    const t = i.token;
    if (!t || seen.has(t)) return false;
    seen.add(t);
    return true;
  });
}

/**
 * Main entry point — extract __NEXT_DATA__ JSON from raw HTML and parse it
 * into ParsedProperty[].
 */
export function parseYad2NextData(
  html: string,
  propertyType: 'rent' | 'sale',
  ownerTypeFilter?: string | null,
): ParserResult {
  const result: ParserResult = {
    success: false,
    properties: [],
    stats: {
      total_found: 0,
      with_price: 0,
      with_rooms: 0,
      with_address: 0,
      with_size: 0,
      with_floor: 0,
      private_count: 0,
      broker_count: 0,
      unknown_count: 0,
    },
  };

  if (!html || html.length < 1000) {
    console.warn(`⚠️ parseYad2NextData: html too short (${html?.length || 0})`);
    return result;
  }

  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) {
    console.warn('⚠️ parseYad2NextData: __NEXT_DATA__ not found');
    return result;
  }

  let nextData: any;
  try {
    nextData = JSON.parse(m[1]);
  } catch (e) {
    console.error('❌ parseYad2NextData: JSON parse failed:', (e as Error).message);
    return result;
  }

  const items = extractFeedItems(nextData);
  console.log(`🟠 parseYad2NextData: extracted ${items.length} feed items`);

  for (const item of items) {
    if (!item.token) continue;

    const isPrivate = detectIsPrivate(item);
    if (isPrivate === true) result.stats.private_count++;
    else if (isPrivate === false) result.stats.broker_count++;
    else result.stats.unknown_count = (result.stats.unknown_count || 0) + 1;

    // Apply owner_type_filter (private | broker) if configured
    if (ownerTypeFilter === 'private' && isPrivate !== true) continue;
    if (ownerTypeFilter === 'broker' && isPrivate !== false) continue;

    const address = buildAddress(item);
    const features: PropertyFeatures = {};
    // Tag-based hints (Yad2 marks balcony/elevator/parking via tags occasionally)
    for (const tag of item.tags || []) {
      const name = (tag.name || '').toLowerCase();
      if (name.includes('מעלית')) features.elevator = true;
      else if (name.includes('חני')) features.parking = true;
      else if (name.includes('מרפסת')) features.balcony = true;
      else if (name.includes('ממ"ד') || name.includes('ממד')) features.mamad = true;
      else if (name.includes('מחסן')) features.storage = true;
    }

    const property: ParsedProperty = {
      source: 'yad2',
      source_id: item.token,
      source_url: buildYad2Url(item.token),
      title: buildTitle(item, propertyType),
      city: item.address?.city?.text || 'תל אביב יפו',
      neighborhood: item.address?.neighborhood?.text || null,
      neighborhood_value: null,
      address,
      price: typeof item.price === 'number' && item.price > 0 ? item.price : null,
      rooms: item.additionalDetails?.roomsCount ?? null,
      size: item.additionalDetails?.squareMeter ?? null,
      floor: typeof item.address?.house?.floor === 'number' ? item.address!.house!.floor! : null,
      property_type: propertyType,
      is_private: isPrivate,
      entry_date: null,
      features: Object.keys(features).length ? features : undefined,
      raw_data: {
        adType: item.adType,
        agencyName: item.customer?.agencyName,
        coverImage: item.metaData?.coverImage,
        images: item.metaData?.images,
      },
    };

    if (property.price) result.stats.with_price++;
    if (property.rooms) result.stats.with_rooms++;
    if (property.address) result.stats.with_address++;
    if (property.size) result.stats.with_size++;
    if (property.floor !== null) result.stats.with_floor++;

    result.properties.push(property);
  }

  result.stats.total_found = result.properties.length;
  result.success = result.properties.length > 0;
  return result;
}
