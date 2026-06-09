// src/lib/social-content.ts
//
// Pure, side-effect-free helpers for social-post content generation,
// consolidated out of AutoPublishManager.tsx / RotationList.tsx.
//
// NO React, NO Supabase, NO DOM. Every function is a pure function of its
// arguments. Behaviour is byte-for-byte identical to the inline copies it
// replaces; the per-call-site differences are preserved via explicit options.
//
// Two property data shapes flow through these helpers and they are NOT the
// same:
//   * `properties` state in AutoPublishManager (Supabase `properties` row):
//       has `current_market_value`, `monthly_rent`, `description`, `address`.
//   * `websiteProperties` from useWebsiteProperties(): has `address`,
//       `monthly_rent`, `description` but NO `current_market_value`.
// The helpers below read fields defensively (missing -> '') so either shape
// is safe, but callers MUST pass the right options to keep current output.

/** Minimal structural type covering both property shapes used by these helpers. */
export interface PropertyLike {
  property_type?: string | null;
  monthly_rent?: number | string | null;
  current_market_value?: number | string | null;
  rooms?: number | string | null;
  property_size?: number | string | null;
  floor?: number | string | null;
  neighborhood?: string | null;
  city?: string | null;
  address?: string | null;
  description?: string | null;
}

/**
 * Hebrew label form for a property_type:
 *  - 'noun'        -> sale:'מכירה' | rental:'השכרה' | else: the raw type || ''  (ternary)
 *  - 'nounBinary'  -> sale:'מכירה' | else:'השכרה'                               (binary)
 *  - 'preposition' -> sale:'למכירה' | else:'להשכרה'                            (binary)
 *
 * Both binary forms collapse every non-'sale' type (incl. 'management'/'project')
 * to the rental label — this matches the original inline code exactly, which is
 * why `nounBinary` exists separately from `noun`.
 */
export type PropertyTypeLabelForm = 'noun' | 'nounBinary' | 'preposition';

export function propertyTypeLabel(
  type: string | null | undefined,
  form: PropertyTypeLabelForm,
): string {
  if (form === 'preposition') return type === 'sale' ? 'למכירה' : 'להשכרה';
  if (form === 'nounBinary') return type === 'sale' ? 'מכירה' : 'השכרה';
  // 'noun' (ternary)
  if (type === 'sale') return 'מכירה';
  if (type === 'rental') return 'השכרה';
  return type || '';
}

export interface FormatPriceOptions {
  /** monthly_rent only, never current_market_value (RotationList, next-in-queue, link preview). */
  rentOnly?: boolean;
  /** buildLinkCard precedence: sale -> current_market_value; else -> monthly_rent (+ rentSuffix). */
  typeAware?: boolean;
  /** Suffix appended to the rent branch only (e.g. '/חודש'); in practice only buildLinkCard passes it. */
  rentSuffix?: string;
}

function shekels(value: number | string | null | undefined): string {
  // Mirrors the original `₪${Number(x).toLocaleString()}` exactly.
  return `₪${Number(value).toLocaleString()}`;
}

/**
 * Format a property's price as a ₪-prefixed, thousands-grouped string, or ''.
 *  - default        : monthly_rent -> current_market_value -> ''
 *  - { rentOnly }    : monthly_rent -> ''
 *  - { typeAware, rentSuffix:'/חודש' }: sale -> current_market_value; else -> rent + suffix
 */
export function formatPropertyPrice(
  prop: PropertyLike,
  opts: FormatPriceOptions = {},
): string {
  const suffix = opts.rentSuffix ?? '';

  if (opts.typeAware) {
    if (prop.property_type === 'sale') {
      return prop.current_market_value ? shekels(prop.current_market_value) : '';
    }
    return prop.monthly_rent ? `${shekels(prop.monthly_rent)}${suffix}` : '';
  }

  if (opts.rentOnly) {
    return prop.monthly_rent ? `${shekels(prop.monthly_rent)}${suffix}` : '';
  }

  if (prop.monthly_rent) return `${shekels(prop.monthly_rent)}${suffix}`;
  if (prop.current_market_value) return shekels(prop.current_market_value);
  return '';
}

export interface FillPlaceholderOptions {
  /** {address} source: 'neighborhood' (default) -> neighborhood||city ; 'address' -> address||neighborhood. */
  addressMode?: 'neighborhood' | 'address';
  /** {price} strategy: 'fallback' (default) -> rent->market->'' ; 'rentOnly' -> rent only. */
  priceMode?: 'fallback' | 'rentOnly';
  /** {description}: false (default) -> always '' ; true -> prop.description || ''. */
  includeDescription?: boolean;
  /** Hebrew label form for {property_type}. Default 'noun' (ternary). */
  typeLabel?: PropertyTypeLabelForm;
}

/**
 * Substitute {address}/{price}/{rooms}/{size}/{floor}/{neighborhood}/{city}/
 * {description}/{property_type} placeholders in a template string.
 *
 * Defaults reproduce AutoPublishManager's old inline fillPropertyPlaceholders.
 * buildPreviewText is reproduced with:
 *   { addressMode:'address', priceMode:'rentOnly', includeDescription:true, typeLabel:'nounBinary' }.
 * (nounBinary, not noun: the old buildPreviewText mapped any non-sale to 'השכרה'.)
 *
 * The .replace order/regexes are kept identical to the originals so output is byte-for-byte stable.
 */
export function fillPropertyPlaceholders(
  text: string,
  prop: PropertyLike,
  opts: FillPlaceholderOptions = {},
): string {
  const addressMode = opts.addressMode ?? 'neighborhood';
  const priceMode = opts.priceMode ?? 'fallback';
  const typeForm = opts.typeLabel ?? 'noun';

  const address =
    addressMode === 'address'
      ? prop.address || prop.neighborhood || ''
      : prop.neighborhood || prop.city || '';

  const price = formatPropertyPrice(
    prop,
    priceMode === 'rentOnly' ? { rentOnly: true } : {},
  );

  const description = opts.includeDescription ? prop.description || '' : '';
  const typeLabel = propertyTypeLabel(prop.property_type, typeForm);

  return text
    .replace(/{address}/g, address)
    .replace(/{price}/g, price)
    .replace(/{rooms}/g, prop.rooms?.toString() || '')
    .replace(/{size}/g, prop.property_size?.toString() || '')
    .replace(/{floor}/g, prop.floor?.toString() || '')
    .replace(/{neighborhood}/g, prop.neighborhood || '')
    .replace(/{city}/g, prop.city || '')
    .replace(/{description}/g, description)
    .replace(/{property_type}/g, typeLabel);
}

/**
 * Turn a free-text token (city / neighborhood) into a hashtag-safe slug by
 * replacing spaces and dashes with underscores. Mirrors `.replace(/[-\s]/g, '_')`.
 */
export function hashtagSlug(value: string | null | undefined): string {
  return (value || '').replace(/[-\s]/g, '_');
}

/**
 * Substitute {neighborhood}/{city}/{property_type} inside a hashtag string,
 * then collapse double-#, strip '# ' and a trailing '#'. property_type uses the
 * preposition form (למכירה/להשכרה). Exact .replace order preserved.
 */
export function fillHashtagPlaceholders(
  tags: string,
  prop: PropertyLike,
): string {
  return tags
    .replace(/{neighborhood}/g, hashtagSlug(prop.neighborhood))
    .replace(/{city}/g, hashtagSlug(prop.city))
    .replace(/{property_type}/g, propertyTypeLabel(prop.property_type, 'preposition'))
    .replace(/#{2,}/g, '#')
    .replace(/#\s/g, '')
    .replace(/#$/g, '')
    .trim();
}
