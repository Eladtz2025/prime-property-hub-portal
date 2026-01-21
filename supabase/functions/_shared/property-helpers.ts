/**
 * Shared property helper functions used by all scout functions
 * Consolidates duplicated code from scout-yad2, scout-madlan, scout-homeless
 */

import { normalizeCityName } from "./broker-detection.ts";

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

// ==================== Save Property ====================

/**
 * Save a scraped property to the database with duplicate detection
 * Uses comprehensive logic with duplicate group management and price alerts
 */
export async function saveProperty(
  supabase: any, 
  property: ScrapedProperty
): Promise<{ isNew: boolean }> {
  const normalizedCity = normalizeCityName(property.city);
  
  // Duplicate detection setup
  let duplicateGroupId: string | null = null;
  let isPrimaryListing = true;
  const addressHasBuildingNumber = property.address && /\d+/.test(property.address);
  const duplicateCheckPossible = addressHasBuildingNumber && !!property.rooms && !!normalizedCity;
  
  if (duplicateCheckPossible) {
    const { data: duplicates } = await supabase
      .rpc('find_duplicate_property', {
        p_address: property.address,
        p_rooms: property.rooms,
        p_floor: property.floor || 0,
        p_property_type: property.property_type || 'rental',
        p_city: normalizedCity,
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
            duplicate_detected_at: new Date().toISOString()
          })
          .eq('id', primaryDuplicate.id);
      }
    }
  }
  
  // Upsert the property
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
      duplicate_check_possible: duplicateCheckPossible,
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
    .select('id, price')
    .single();

  if (!upsertError && upsertResult) {
    // Create duplicate alert if there's a significant price difference
    if (duplicateGroupId && property.price) {
      const { data: primaryProperty } = await supabase
        .from('scouted_properties')
        .select('id, price')
        .eq('duplicate_group_id', duplicateGroupId)
        .eq('is_primary_listing', true)
        .single();
      
      if (primaryProperty?.price && primaryProperty.price > 0) {
        const priceDiff = Math.abs(property.price - primaryProperty.price);
        const priceDiffPercent = (priceDiff / Math.min(property.price, primaryProperty.price)) * 100;
        
        if (priceDiffPercent > 5) {
          await supabase
            .from('duplicate_alerts')
            .insert({
              primary_property_id: primaryProperty.id,
              duplicate_property_id: upsertResult.id,
              price_difference: priceDiff,
              price_difference_percent: priceDiffPercent
            });
        }
      }
    }
    return { isNew: true };
  }
  
  return { isNew: false };
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
