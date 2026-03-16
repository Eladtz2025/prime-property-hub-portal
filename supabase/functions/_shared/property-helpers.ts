/**
 * Shared property helper functions used by all scout functions
 * Consolidates duplicated code from scout-yad2, scout-madlan, scout-homeless
 */

import { normalizeCityName, isInvalidAddress } from "./broker-detection.ts";

// ==================== Listing ID Extraction ====================

/**
 * Extract listing ID from URL based on source
 * Used to identify same-source duplicates with different tracking parameters
 */
export function extractListingId(url: string, source: string): string | null {
  if (!url) return null;
  
  if (source === 'yad2') {
    // /realestate/item/abc123 or /realestate/item/tel-aviv-area/abc123
    const match = url.match(/\/realestate\/item\/(?:[^\/]+\/)?([a-zA-Z0-9]+)/i);
    return match ? match[1] : null;
  }
  
  if (source === 'madlan') {
    // /listings/ABC123 or /listings/abc-123_xyz → listing slug/id
    const match = url.match(/\/listings?\/([^\/\?#]+)/i);
    return match ? match[1] : null;
  }
  
  if (source === 'homeless') {
    // viewad,12345 or adid=12345 → 12345
    const match = url.match(/(?:viewad[,\/]|adid=)(\d+)/i);
    return match ? match[1] : null;
  }
  
  return null;
}

/**
 * Normalize source URL by removing tracking/pagination parameters
 * Keeps the clean URL for storage and deduplication
 */
export function normalizeSourceUrl(url: string, source: string): string {
  if (!url) return url;
  
  try {
    const parsed = new URL(url);
    
    // Remove common tracking/pagination params for all sources
    const paramsToRemove = [
      'opened-from', 'utm_source', 'utm_medium', 'utm_campaign',
      'page', 'pagination', 'ref', 'fbclid', 'gclid'
    ];
    
    paramsToRemove.forEach(param => parsed.searchParams.delete(param));
    
    if (source === 'yad2') {
      // Yad2: remove all query params (clean item URL)
      return `${parsed.origin}${parsed.pathname}`;
    }
    
    if (source === 'madlan') {
      // Madlan: remove all query params for listing pages
      if (parsed.pathname.includes('/listings/')) {
        return `${parsed.origin}${parsed.pathname}`;
      }
    }
    
    if (source === 'homeless') {
      // Homeless: keep only adid param
      const adid = parsed.searchParams.get('adid');
      if (adid) {
        return `${parsed.origin}${parsed.pathname}?adid=${adid}`;
      }
    }
    
    // Return URL with cleaned params
    const remainingParams = parsed.searchParams.toString();
    return remainingParams 
      ? `${parsed.origin}${parsed.pathname}?${remainingParams}`
      : `${parsed.origin}${parsed.pathname}`;
  } catch {
    // If URL parsing fails, fallback to simple split
    return url.split('?')[0];
  }
}

// ==================== Cross-Source Duplicate Detection ====================

/**
 * Find cross-source duplicate by address, city, and rooms
 * Returns the existing property ID if a duplicate from a different source exists
 */
async function findCrossSourceDuplicate(
  supabase: any,
  property: ScrapedProperty
): Promise<{ id: string; duplicate_group_id?: string | null } | null> {
  // Need address with building number, city, and rooms to check
  const hasValidAddress = property.address && /\d+/.test(property.address);
  if (!hasValidAddress || !property.city || property.rooms === undefined) {
    return null;
  }

  const normalizedCity = normalizeCityName(property.city);
  
  const { data: existing } = await supabase
    .from('scouted_properties')
    .select('id, duplicate_group_id')
    .eq('city', normalizedCity)
    .eq('address', property.address)
    .eq('rooms', property.rooms)
    .eq('property_type', property.property_type)
    .eq('is_active', true)
    .neq('source', property.source)
    .limit(1)
    .maybeSingle();

  return existing || null;
}

// ==================== Same-Source Duplicate Detection ====================

/**
 * Find same-source duplicate by listing ID
 * Returns the existing property if a duplicate from the same source exists
 */
async function findSameSourceDuplicate(
  supabase: any,
  property: ScrapedProperty,
  normalizedSourceUrl: string
): Promise<{ id: string; source_url: string } | null> {
  // 1) Most reliable: exact source + source_id
  if (property.source_id) {
    const { data: existingBySourceId } = await supabase
      .from('scouted_properties')
      .select('id, source_url')
      .eq('source', property.source)
      .eq('source_id', property.source_id)
      .limit(1)
      .maybeSingle();

    if (existingBySourceId) {
      return existingBySourceId;
    }
  }

  // 2) Exact source + normalized URL
  const { data: existingByUrl } = await supabase
    .from('scouted_properties')
    .select('id, source_url')
    .eq('source', property.source)
    .eq('source_url', normalizedSourceUrl)
    .limit(1)
    .maybeSingle();

  return existingByUrl || null;
}

// ==================== Interface ====================

export interface ScrapedProperty {
  source: string;
  source_url: string;
  source_id: string;
  title?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  price?: number;
  rooms?: number;
  size?: number;
  floor?: number;
  property_type: 'rent' | 'sale';
  description?: string;
  images?: string[];
  features?: Record<string, boolean>;
  raw_data?: any;
  is_private?: boolean | null;
}

// ==================== URL Validation ====================

/**
 * Validates that a source URL is a valid direct listing URL
 * Rejects project pages, search pages, and other non-listing URLs
 */
export function isValidSourceUrl(url: string, source: string): boolean {
  if (!url) return false;
  
  // Yad2 validation
  if (source === 'yad2') {
    // Must be /realestate/item/ pattern
    if (!url.includes('/realestate/item/')) return false;
    // Reject yad1, project, and search URLs
    if (url.includes('/yad1/')) return false;
    if (url.includes('/project/')) return false;
    if (url.includes('forsale?')) return false;
    if (url.includes('forrent?')) return false;
    return true;
  }
  
  // Madlan validation
  if (source === 'madlan') {
    // Must be /listings/ pattern
    if (!url.includes('/listings/')) return false;
    // Reject projects and search pages
    if (url.includes('/projects/')) return false;
    if (url.includes('/for-rent/')) return false;
    if (url.includes('/for-sale/')) return false;
    return true;
  }
  
  // Homeless validation
  if (source === 'homeless') {
    // Accept both:
    // - /viewad.aspx?adid=12345
    // - /viewad,12345 or /viewad,12345.aspx
    const hasAspxPattern = /\/viewad\.aspx\?[^\s]*adid=\d+/i.test(url);
    const hasCommaPattern = /\/viewad,\d+(?:\.aspx)?/i.test(url);
    return hasAspxPattern || hasCommaPattern;
  }
  
  return true; // Unknown sources pass through
}

// ==================== Configuration ====================

const MIN_RENT_PRICE = 3000;  // Minimum rent price (filters parking spots, storage)
const MIN_SALE_PRICE = 100000; // Minimum sale price

// ==================== Save Property ====================

/**
 * Save a scraped property to the database with strict duplicate detection
 * Requirements: exact address+city+rooms+floor match, optional size within 15%
 */
export async function saveProperty(
  supabase: any, 
  property: ScrapedProperty
): Promise<{ isNew: boolean; skipped?: boolean }> {
  
  // === FIRST: Validate source URL (skip search pages, invalid URLs) ===
  if (!isValidSourceUrl(property.source_url, property.source)) {
    console.log(`🚫 Skipping invalid URL (search page or non-listing): ${property.source_url}`);
    return { isNew: false, skipped: true };
  }
  
  const normalizedCity = normalizeCityName(property.city);
  
  // Validate Tel Aviv only - skip non-Tel Aviv properties entirely
  const isTelAviv = normalizedCity && 
    (normalizedCity.includes('תל אביב') || normalizedCity.includes('תל-אביב'));
  
  if (normalizedCity && !isTelAviv) {
    console.log(`🚫 Skipping non-Tel Aviv property: ${normalizedCity}`);
    return { isNew: false, skipped: true };
  }
  
  // Filter out low-price listings (parking spots, storage, etc.)
  if (property.price) {
    const minPrice = property.property_type === 'rent' ? MIN_RENT_PRICE : MIN_SALE_PRICE;
    if (property.price < minPrice) {
      console.log(`🚫 Skipping low-price property: ${property.price} ₪ (min: ${minPrice})`);
      return { isNew: false, skipped: true };
    }
  }
  
  // Filter out addresses that contain broker/agency names
  if (isInvalidAddress(property.address)) {
    console.log(`🚫 Skipping property with invalid address (broker name): ${property.address}`);
    return { isNew: false, skipped: true };
  }

  // Ensure is_private is strictly boolean or null (defensive check)
  const safeIsPrivate = property.is_private === true ? true 
    : property.is_private === false ? false 
    : null;

  // Normalize source URL before duplicate checks/saving
  const normalizedSourceUrl = normalizeSourceUrl(property.source_url, property.source);
  
  // Duplicate detection - only if we have valid data for strict matching
  let duplicateGroupId: string | null = null;
  let isPrimaryListing = true;
  
  // Address must contain a building number to be eligible for duplicate detection
  const hasValidAddress = property.address && /\d+/.test(property.address);
  const canCheckDuplicates = !!(hasValidAddress 
    && property.rooms !== undefined 
    && property.floor !== undefined 
    && normalizedCity);
  
  if (canCheckDuplicates) {
    const { data: duplicates } = await supabase
      .rpc('find_property_duplicate', {
        p_address: property.address,
        p_city: normalizedCity,
        p_rooms: property.rooms,
        p_floor: property.floor,
        p_size: property.size || null,
        p_exclude_id: null
      });
    
    if (duplicates && duplicates.length > 0) {
      const primaryDuplicate = duplicates[0];
      duplicateGroupId = primaryDuplicate.duplicate_group_id || primaryDuplicate.id;
      isPrimaryListing = false;
      
      // Update primary if it doesn't have a group yet
      if (!primaryDuplicate.duplicate_group_id) {
        await supabase
          .from('scouted_properties')
          .update({ 
            duplicate_group_id: duplicateGroupId,
            duplicate_detected_at: new Date().toISOString(),
            is_primary_listing: true
          })
          .eq('id', primaryDuplicate.id);
      }
    }
  }
  
  // Check for same-source duplicates (source+source_id OR exact normalized URL)
  const existingSameSource = await findSameSourceDuplicate(supabase, property, normalizedSourceUrl);

  if (existingSameSource) {
    // Update existing property with latest data and reactivate if needed
    console.log(`🔄 Same-source duplicate found: ${property.source_url} matches ${existingSameSource.source_url}`);
    const { error: updateError } = await supabase
      .from('scouted_properties')
      .update({
        source_url: normalizedSourceUrl,
        source_id: property.source_id,
        price: property.price,
        title: property.title,
        city: normalizedCity,
        neighborhood: property.neighborhood,
        address: property.address,
        rooms: property.rooms,
        size: property.size,
        floor: property.floor,
        description: property.description,
        images: property.images || [],
        features: property.features || {},
        raw_data: property.raw_data,
        property_type: property.property_type,
        is_private: safeIsPrivate,
        // NOTE: Do NOT reset status or availability_check_reason here.
        // The property may already be 'matched' or have availability data.
        is_active: true,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSameSource.id);

    if (updateError) {
      console.warn(`⚠️ Same-source update failed for ${normalizedSourceUrl}: ${updateError.message}`);
    }

    return { isNew: false };
  }

  // Check for cross-source duplicates (same property from different source)
  // Keep ingesting this listing, but attach it to the duplicate group.
  const crossSourceDuplicate = await findCrossSourceDuplicate(supabase, property);
  if (crossSourceDuplicate) {
    const crossSourceGroupId = crossSourceDuplicate.duplicate_group_id || crossSourceDuplicate.id;
    duplicateGroupId = duplicateGroupId || crossSourceGroupId;
    isPrimaryListing = false;

    console.log(`🔄 Cross-source duplicate found: ${property.source_url} matches existing ID ${crossSourceDuplicate.id}`);

    // Ensure the existing listing is marked as primary group record if needed
    if (!crossSourceDuplicate.duplicate_group_id) {
      await supabase
        .from('scouted_properties')
        .update({
          duplicate_group_id: crossSourceGroupId,
          duplicate_detected_at: new Date().toISOString(),
          is_primary_listing: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', crossSourceDuplicate.id);
    }
  }

  // Check if property already existed before upsert (for accurate new counter)
  let existedBefore = false;

  if (property.source_id) {
    const { data: existingBySourceId } = await supabase
      .from('scouted_properties')
      .select('id')
      .eq('source', property.source)
      .eq('source_id', property.source_id)
      .limit(1)
      .maybeSingle();

    existedBefore = !!existingBySourceId;
  }

  if (!existedBefore) {
    const { data: existingByUrl } = await supabase
      .from('scouted_properties')
      .select('id')
      .eq('source', property.source)
      .eq('source_url', normalizedSourceUrl)
      .limit(1)
      .maybeSingle();

    existedBefore = !!existingByUrl;
  }

  // Determine if backfill is needed based on available data
  const hasAllCriticalFields = !!(
    property.rooms !== undefined && property.rooms !== null &&
    property.price !== undefined && property.price !== null &&
    property.size !== undefined && property.size !== null &&
    property.floor !== undefined && property.floor !== null &&
    property.neighborhood &&
    property.features && Object.keys(property.features).length > 0
  );
  const backfillStatus = hasAllCriticalFields ? 'not_needed' : 'pending';
  if (hasAllCriticalFields) {
    console.log(`✅ All critical fields present for ${normalizedSourceUrl}, marking backfill as not_needed`);
  }

  // UPSERT: Insert new property or update if (source, source_url) already exists
  const { data: upsertResult, error: upsertError } = await supabase
    .from('scouted_properties')
    .upsert({
      source: property.source,
      source_url: normalizedSourceUrl,
      source_id: property.source_id,
      title: property.title,
      city: normalizedCity,
      neighborhood: property.neighborhood,
      address: property.address,
      price: property.price,
      rooms: property.rooms,
      size: property.size,
      floor: property.floor,
      duplicate_check_possible: canCheckDuplicates,
      property_type: property.property_type,
      description: property.description,
      images: property.images || [],
      features: property.features || {},
      raw_data: property.raw_data,
      status: 'new',
      is_active: true,
      availability_check_reason: null,
      is_private: safeIsPrivate,
      duplicate_group_id: duplicateGroupId,
      is_primary_listing: isPrimaryListing,
      duplicate_detected_at: duplicateGroupId ? new Date().toISOString() : null,
      dedup_checked_at: null,
      last_seen_at: new Date().toISOString(),
      backfill_status: backfillStatus,
    }, {
      onConflict: 'source,source_url',
      ignoreDuplicates: false  // Update existing records
    })
    .select('id')
    .single();

  if (upsertError) {
    console.log(`⚠️ Upsert error for ${normalizedSourceUrl}: ${upsertError.message}`);
    return { isNew: false };
  }

  return { isNew: !existedBefore && !!upsertResult };
}

// ==================== Date Parsing ====================

/**
 * Parse Hebrew date strings into YYYY-MM-DD format
 * Supports: DD/MM/YYYY, DD.MM.YYYY, Hebrew month names
 */
export function parseHebrewDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  const hebrewMonths: Record<string, number> = {
    'ינואר': 1, 'פברואר': 2, 'מרץ': 3, 'אפריל': 4,
    'מאי': 5, 'יוני': 6, 'יולי': 7, 'אוגוסט': 8,
    'ספטמבר': 9, 'אוקטובר': 10, 'נובמבר': 11, 'דצמבר': 12
  };
  
  // Try DD/MM/YYYY or DD.MM.YYYY format
  const slashMatch = dateStr.match(/(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{2,4})/);
  if (slashMatch) {
    const [_, day, month, year] = slashMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try Hebrew month names
  for (const [heb, num] of Object.entries(hebrewMonths)) {
    if (dateStr.includes(heb)) {
      const yearMatch = dateStr.match(/\d{4}/);
      if (yearMatch) {
        return `${yearMatch[0]}-${String(num).padStart(2, '0')}-01`;
      }
    }
  }
  
  return null;
}

