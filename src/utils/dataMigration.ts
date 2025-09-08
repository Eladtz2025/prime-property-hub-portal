import { supabase } from '@/integrations/supabase/client';
import { fixPhoneNumber } from './dataProcessor';

interface RawPropertyData {
  address: string;
  owner_name: string;
  owner_phone: string;
  tenant_name?: string;
  tenant_phone?: string;
  entry_date?: string;
}

interface OwnerData {
  שם: string;
  טלפון: string;
  כתובת: string;
}

export const migratePropertiesData = async () => {
  try {
    // Fetch the main properties JSON file
    const propertiesResponse = await fetch('/כל הנכסים - JSON ל-AI.json');
    const rawProperties: RawPropertyData[] = await propertiesResponse.json();

    // Fetch the owners JSON file
    const ownersResponse = await fetch('/בעלי_דירות_מעודכן.json');
    const rawOwners: OwnerData[] = await ownersResponse.json();

    console.log(`Starting migration of ${rawProperties.length} properties and ${rawOwners.length} owners`);

    // First, migrate properties and create property owners
    const migratedCount = await processPropertiesData(rawProperties);
    
    // Then, process additional owners who might not have properties yet
    const additionalOwnersCount = await processAdditionalOwners(rawOwners, rawProperties);

    console.log(`Migration completed: ${migratedCount} properties, ${additionalOwnersCount} additional owners`);
    
    return {
      success: true,
      propertiesCount: migratedCount,
      ownersCount: additionalOwnersCount,
      totalRecords: migratedCount + additionalOwnersCount
    };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

const processPropertiesData = async (rawProperties: RawPropertyData[]) => {
  let successCount = 0;

  for (const rawProperty of rawProperties) {
    try {
      // Skip invalid entries
      if (!rawProperty.address || !rawProperty.owner_name || 
          rawProperty.address === 'רחוב' || rawProperty.owner_name === 'שם בעל דירה') {
        continue;
      }

      // Clean and prepare property data
      const propertyData = {
        address: rawProperty.address.trim(),
        city: extractCityFromAddress(rawProperty.address),
        status: 'unknown' as const,
        contact_status: 'not_contacted' as const,
        contact_attempts: 0
      };

      // Insert property
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (propertyError) {
        console.error('Failed to insert property:', propertyError);
        continue;
      }

      // Create or find owner profile
      const ownerEmail = generateOwnerEmail(rawProperty.owner_name);
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', ownerEmail)
        .maybeSingle();

      let ownerId: string;

      if (ownerProfile) {
        ownerId = ownerProfile.id;
      } else {
        // For demo purposes, create a profile entry directly
        // In production, this would be handled by proper user creation flow
        const tempId = crypto.randomUUID();
        const { data: newOwner, error: ownerError } = await supabase
          .from('profiles')
          .insert({
            id: tempId,
            email: ownerEmail,
            full_name: rawProperty.owner_name.trim(),
            role: 'property_owner'
          })
          .select()
          .single();

        if (ownerError) {
          console.error('Failed to create owner profile:', ownerError);
          continue;
        }

        ownerId = newOwner.id;
      }

      // Create property ownership relationship
      await supabase
        .from('property_owners')
        .insert({
          property_id: property.id,
          owner_id: ownerId,
          ownership_percentage: 100
        });

      // Create tenant if exists
      if (rawProperty.tenant_name && rawProperty.tenant_name !== 'nan' && rawProperty.tenant_name.trim()) {
        const tenantData = {
          property_id: property.id,
          name: rawProperty.tenant_name.trim(),
          phone: rawProperty.tenant_phone ? fixPhoneNumber(rawProperty.tenant_phone) : null,
          lease_start_date: rawProperty.entry_date && rawProperty.entry_date !== 'nan' ? rawProperty.entry_date : null,
          is_active: true
        };

        await supabase
          .from('tenants')
          .insert(tenantData);

        // Update property status to occupied
        await supabase
          .from('properties')
          .update({ status: 'occupied' })
          .eq('id', property.id);
      }

      successCount++;
    } catch (error) {
      console.error('Error processing property:', error);
    }
  }

  return successCount;
};

const processAdditionalOwners = async (rawOwners: OwnerData[], rawProperties: RawPropertyData[]) => {
  let successCount = 0;
  const processedOwnerNames = new Set(rawProperties.map(p => p.owner_name?.trim().toLowerCase()));

  for (const rawOwner of rawOwners) {
    try {
      // Skip if owner already processed through properties
      if (processedOwnerNames.has(rawOwner.שם?.trim().toLowerCase())) {
        continue;
      }

      if (!rawOwner.שם || !rawOwner.טלפון) {
        continue;
      }

      const ownerEmail = generateOwnerEmail(rawOwner.שם);
      
      // Check if owner already exists
      const { data: existingOwner } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', ownerEmail)
        .maybeSingle();

      if (existingOwner) {
        continue;
      }

      // For demo purposes, create a profile entry directly
      const tempId = crypto.randomUUID();
      await supabase
        .from('profiles')
        .insert({
          id: tempId,
          email: ownerEmail,
          full_name: rawOwner.שם.trim(),
          role: 'property_owner'
        });

      successCount++;
    } catch (error) {
      console.error('Error processing additional owner:', error);
    }
  }

  return successCount;
};

const extractCityFromAddress = (address: string): string => {
  if (!address) return 'לא צוין';
  
  const lowerAddress = address.toLowerCase();
  
  if (lowerAddress.includes('תל אביב') || lowerAddress.includes('tel aviv')) {
    return 'תל אביב';
  }
  if (lowerAddress.includes('ירושלים') || lowerAddress.includes('jerusalem')) {
    return 'ירושלים';
  }
  if (lowerAddress.includes('חיפה') || lowerAddress.includes('haifa')) {
    return 'חיפה';
  }
  if (lowerAddress.includes('ראשון לציון')) {
    return 'ראשון לציון';
  }
  if (lowerAddress.includes('פתח תקוה')) {
    return 'פתח תקוה';
  }
  
  return 'תל אביב'; // Default fallback
};

const generateOwnerEmail = (ownerName: string): string => {
  const cleanName = ownerName
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9א-ת\s]/g, '')
    .replace(/\s+/g, '.');
  
  return `${cleanName}@property-portal.local`;
};