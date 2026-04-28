/**
 * Madlan SSR Parser
 *
 * As of late April 2026, Madlan migrated away from Apollo/__NEXT_DATA__
 * patterns. The new SSR system embeds the full Apollo cache in:
 *   window.__SSR_HYDRATED_CONTEXT__ = {...}
 *
 * Listings live at:
 *   reduxInitialState.domainData.searchList.data.searchPoiV2.poi[]
 *
 * Each poi item (when type === "bulletin") includes:
 *   id, dealType ("unitRent"/"unitSale"), address, addressDetails {...},
 *   beds, floor, area, price, buildingYear, buildingClass,
 *   poc.type ("agent" | "private"), images[]
 */

import { extractFeatures, type ParsedProperty, type ParserResult } from './parser-utils.ts';

// Reuse same neighborhood patterns as parser-madlan-html
const KNOWN_NEIGHBORHOODS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /צפון\s*(?:ה)?ישן|הצפון\s*הישן/i, label: 'צפון ישן' },
  { pattern: /צפון\s*(?:ה)?חדש|הצפון\s*החדש/i, label: 'צפון חדש' },
  { pattern: /נמל\s*תל\s*אביב|יורדי\s*הסירה/i, label: 'נמל תל אביב' },
  { pattern: /לב\s*(?:ה)?עיר/i, label: 'לב העיר' },
  { pattern: /פלורנטין/i, label: 'פלורנטין' },
  { pattern: /נווה\s*צדק/i, label: 'נווה צדק' },
  { pattern: /כרם\s*(?:ה)?תימנים/i, label: 'כרם התימנים' },
  { pattern: /רמת\s*אביב\s*(?:ה)?חדשה/i, label: 'רמת אביב החדשה' },
  { pattern: /רמת\s*אביב\s*ג'?/i, label: "רמת אביב ג'" },
  { pattern: /רמת\s*אביב/i, label: 'רמת אביב' },
  { pattern: /אפקה/i, label: 'אפקה' },
  { pattern: /נווה\s*אביבים/i, label: 'נווה אביבים' },
  { pattern: /יפו/i, label: 'יפו' },
  { pattern: /שפירא/i, label: 'שפירא' },
  { pattern: /מונטיפיורי/i, label: 'מונטיפיורי' },
  { pattern: /הדר\s*יוסף/i, label: 'הדר יוסף' },
  { pattern: /בבלי/i, label: 'בבלי' },
  { pattern: /יד\s*(?:ה)?חרוצים/i, label: 'יד חרוצים' },
  { pattern: /קרית\s*שלום/i, label: 'קרית שלום' },
  { pattern: /נוה\s*שאנן|נווה\s*שאנן/i, label: 'נווה שאנן' },
  { pattern: /(?:שכונת\s*)?התקווה/i, label: 'שכונת התקווה' },
  { pattern: /כיכר\s*המדינה/i, label: 'כיכר המדינה' },
  { pattern: /לב\s*תל\s*אביב/i, label: 'לב תל אביב' },
  { pattern: /ביצרון/i, label: 'ביצרון' },
  { pattern: /נחלת\s*יצחק/i, label: 'נחלת יצחק' },
];

function normalizeNeighborhoodLabel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  for (const { pattern, label } of KNOWN_NEIGHBORHOODS) {
    if (pattern.test(raw)) return label;
  }
  // Return cleaned raw if no match
  return raw.trim() || null;
}

/**
 * Extract __SSR_HYDRATED_CONTEXT__ JSON from HTML.
 * The assignment looks like: __SSR_HYDRATED_CONTEXT__={...};
 * We need to balance braces because the JSON contains nested objects.
 */
function extractSsrContext(html: string): any | null {
  const marker = '__SSR_HYDRATED_CONTEXT__=';
  const startIdx = html.indexOf(marker);
  if (startIdx < 0) return null;

  // Find the opening brace
  let i = startIdx + marker.length;
  while (i < html.length && html[i] !== '{') i++;
  if (i >= html.length) return null;

  const objStart = i;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (; i < html.length; i++) {
    const ch = html[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const jsonStr = html.substring(objStart, i + 1);
        try {
          // The JSON uses \u002F escapes for slashes - JSON.parse handles them natively
          return JSON.parse(jsonStr);
        } catch (e) {
          console.error('[parser-madlan-ssr] JSON.parse failed:', e instanceof Error ? e.message : e);
          return null;
        }
      }
    }
  }
  return null;
}

function getPoiList(ctx: any): any[] {
  const poi = ctx?.reduxInitialState?.domainData?.searchList?.data?.searchPoiV2?.poi;
  if (Array.isArray(poi)) return poi;
  return [];
}

function unescapeMadlanUrl(url: string): string {
  // Madlan stores URLs with \u002F for /
  return url.replace(/\\u002F/g, '/').replace(/\\\//g, '/');
}

function buildImageUrl(imageUrl: string): string {
  const cleaned = unescapeMadlanUrl(imageUrl);
  if (cleaned.startsWith('http')) return cleaned;
  return `https://images.madlan.co.il${cleaned}`;
}

export function parseMadlanSsrHtml(
  html: string,
  propertyType: 'rent' | 'sale',
  ownerTypeFilter?: 'private' | 'broker' | null
): ParserResult {
  const errors: string[] = [];
  const properties: ParsedProperty[] = [];

  console.log(`[parser-madlan-ssr] Input: ${html.length} chars`);
  const ctx = extractSsrContext(html);
  if (!ctx) {
    console.warn('[parser-madlan-ssr] __SSR_HYDRATED_CONTEXT__ not found or unparsable');
    return {
      success: false,
      properties: [],
      stats: {
        total_found: 0, with_price: 0, with_rooms: 0, with_address: 0,
        with_size: 0, with_floor: 0, private_count: 0, broker_count: 0, unknown_count: 0,
      },
      errors: ['SSR context missing'],
    };
  }

  const poiList = getPoiList(ctx);
  console.log(`[parser-madlan-ssr] poi items: ${poiList.length}`);

  for (const poi of poiList) {
    try {
      if (poi?.type !== 'bulletin') continue; // skip projects
      const sourceId = String(poi.id || '').trim();
      if (!sourceId) continue;

      const dealType: string = poi.dealType || '';
      // unitRent/unitsRent → rent ; unitSale/sale → sale
      const isRent = /rent/i.test(dealType);
      const isSale = /sale/i.test(dealType);
      // Filter by requested type when known
      if (propertyType === 'rent' && isSale) continue;
      if (propertyType === 'sale' && isRent) continue;

      const addr = poi.addressDetails || {};
      const city: string = addr.city || 'תל אביב יפו';
      const streetName: string | null = addr.streetName || null;
      const streetNumber: string | null = addr.streetNumber || null;
      const address = poi.address ||
        (streetName ? `${streetName}${streetNumber ? ' ' + streetNumber : ''}` : null);

      const neighbourhoodRaw: string | null = addr.neighbourhood || null;
      const neighborhood = normalizeNeighborhoodLabel(neighbourhoodRaw);

      const price = typeof poi.price === 'number' ? poi.price : null;
      const rooms = typeof poi.beds === 'number' ? poi.beds : null;
      const size = typeof poi.area === 'number' ? poi.area : null;

      // floor can be string ("18", "קרקע") or number
      let floor: number | null = null;
      if (typeof poi.floor === 'number') floor = poi.floor;
      else if (typeof poi.floor === 'string') {
        if (/קרקע/.test(poi.floor)) floor = 0;
        else {
          const n = parseInt(poi.floor, 10);
          if (!isNaN(n)) floor = n;
        }
      }

      // is_private from poc.type ("agent" | "private")
      let isPrivate: boolean | null = null;
      const pocType = poi?.poc?.type;
      if (pocType === 'private') isPrivate = true;
      else if (pocType === 'agent') isPrivate = false;

      if (ownerTypeFilter === 'private' && isPrivate !== true) continue;
      if (ownerTypeFilter === 'broker' && isPrivate !== false) continue;

      const sourceUrl = `https://www.madlan.co.il/listings/${sourceId}`;

      // Title
      const roomsLabel = rooms ? `${rooms} חדרים` : '';
      const typeLabel = propertyType === 'rent' ? 'להשכרה' : 'למכירה';
      const location = neighborhood || city;
      const title = roomsLabel
        ? `דירה ${roomsLabel} ${typeLabel} ב${location}`
        : `דירה ${typeLabel} ב${location}`;

      // Build searchable text for feature extraction (combine address + neighborhood + buildingClass)
      const featureText = [
        address, neighbourhoodRaw,
        poi.generalCondition, poi.buildingClass,
      ].filter(Boolean).join(' ');

      const property: ParsedProperty = {
        source: 'madlan',
        source_id: sourceId,
        source_url: sourceUrl,
        title,
        city,
        neighborhood,
        neighborhood_value: null, // saveProperty normalizes
        address,
        price,
        rooms,
        size,
        floor,
        property_type: propertyType,
        is_private: isPrivate,
        entry_date: null,
        features: extractFeatures(featureText),
        raw_text: `${address || ''} | ${neighbourhoodRaw || ''} | ${poi.buildingClass || ''}`.substring(0, 500),
      };

      // Skip if completely empty
      if (!price && !rooms && !address && !size) continue;

      properties.push(property);
    } catch (err) {
      errors.push(`poi ${poi?.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`[parser-madlan-ssr] ✅ Parsed ${properties.length} properties`);

  return {
    success: true,
    properties,
    stats: {
      total_found: properties.length,
      with_price: properties.filter(p => p.price !== null).length,
      with_rooms: properties.filter(p => p.rooms !== null).length,
      with_address: properties.filter(p => p.address !== null).length,
      with_size: properties.filter(p => p.size !== null).length,
      with_floor: properties.filter(p => p.floor !== null).length,
      private_count: properties.filter(p => p.is_private === true).length,
      broker_count: properties.filter(p => p.is_private === false).length,
      unknown_count: properties.filter(p => p.is_private === null).length,
    },
    errors,
  };
}
