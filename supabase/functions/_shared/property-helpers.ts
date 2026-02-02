/**
 * Shared property helper functions used by all scout functions
 * Consolidates duplicated code from scout-yad2, scout-madlan, scout-homeless
 */

import { normalizeCityName, isInvalidAddress } from "./broker-detection.ts";

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
    // Must be /viewad.aspx pattern with specific ID
    if (!url.includes('/viewad.aspx')) return false;
    if (!url.includes('adid=')) return false;
    return true;
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
  
  // Duplicate detection - only if we have valid data for strict matching
  let duplicateGroupId: string | null = null;
  let isPrimaryListing = true;
  
  // Address must contain a building number to be eligible for duplicate detection
  const hasValidAddress = property.address && /\d+/.test(property.address);
  const canCheckDuplicates = hasValidAddress 
    && property.rooms !== undefined 
    && property.floor !== undefined 
    && normalizedCity;
  
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
  
  // Upsert the property (without duplicate alerts - removed)
  const { data: upsertResult, error: upsertError } = await supabase
    .from('scouted_properties')
    .upsert({
      source: property.source,
      source_url: property.source_url,
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
      is_private: property.is_private,
      duplicate_group_id: duplicateGroupId,
      is_primary_listing: isPrimaryListing,
      duplicate_detected_at: duplicateGroupId ? new Date().toISOString() : null,
      last_seen_at: new Date().toISOString()
    }, {
      onConflict: 'source,source_id',
      ignoreDuplicates: true
    })
    .select('id')
    .single();

  return { isNew: !upsertError && !!upsertResult };
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
