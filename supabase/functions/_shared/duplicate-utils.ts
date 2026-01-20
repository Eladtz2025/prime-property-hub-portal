// Shared duplicate detection utilities for Edge Functions
// Simplified logic: address+number + rooms + city + floor + price (up to 20% diff)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface DuplicateSettings {
  price_diff_threshold: number;  // e.g., 0.20 = 20%
}

export const defaultDuplicateSettings: DuplicateSettings = {
  price_diff_threshold: 0.20,
};

export interface ScoutedPropertyForDuplicate {
  address: string | null;
  rooms: number | null;
  floor: number | null;
  property_type: string;
  city: string | null;
  price: number | null;
  source: string;
}

/**
 * Find duplicate properties in the database
 * Logic: Same address (with building number) + rooms + city + floor + price (within 20%)
 */
export async function findDuplicateGroup(
  supabase: ReturnType<typeof createClient>,
  property: ScoutedPropertyForDuplicate,
  excludeId?: string | null
): Promise<{ id: string; duplicate_group_id: string | null; price: number | null; source: string } | null> {
  // Can't check for duplicates without required fields
  if (!property.address || !property.rooms || !property.city) {
    return null;
  }
  
  // Only check if address contains a building number
  const addressHasBuildingNumber = /\d+/.test(property.address);
  if (!addressHasBuildingNumber) {
    return null;
  }

  const { data: duplicates, error } = await supabase
    .rpc('find_duplicate_property', {
      p_address: property.address,
      p_rooms: property.rooms,
      p_floor: property.floor || 0,
      p_property_type: property.property_type || 'rental',
      p_city: property.city,
      p_price: property.price || null,
      p_exclude_id: excludeId || null
    });
  
  if (error || !duplicates?.length) {
    return null;
  }
  
  return duplicates[0];
}

/**
 * Mark a property as a duplicate in a group
 */
export async function markAsDuplicate(
  supabase: ReturnType<typeof createClient>,
  propertyId: string,
  duplicateGroupId: string
): Promise<void> {
  await supabase
    .from('scouted_properties')
    .update({ 
      duplicate_group_id: duplicateGroupId,
      is_primary_listing: false,
      duplicate_detected_at: new Date().toISOString()
    })
    .eq('id', propertyId);
}

/**
 * Set a property as the primary listing in a duplicate group
 */
export async function markAsPrimaryListing(
  supabase: ReturnType<typeof createClient>,
  propertyId: string,
  duplicateGroupId: string
): Promise<void> {
  await supabase
    .from('scouted_properties')
    .update({ 
      duplicate_group_id: duplicateGroupId,
      is_primary_listing: true,
      duplicate_detected_at: new Date().toISOString()
    })
    .eq('id', propertyId);
}
