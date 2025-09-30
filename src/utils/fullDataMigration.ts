import { consolidateAllPropertyData, ConsolidatedProperty, ConsolidatedOwner } from './dataConsolidation';
import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

const log = logger.component('fullDataMigration');

interface MigrationResult {
  success: boolean;
  propertiesInserted: number;
  ownersInserted: number;
  ownershipLinksCreated: number;
  duplicatesRemoved: number;
  errors: string[];
}

// Merge duplicate properties intelligently
function mergeDuplicateProperties(properties: ConsolidatedProperty[]): ConsolidatedProperty[] {
  const merged: ConsolidatedProperty[] = [];
  const processed = new Set<string>();

  for (const property of properties) {
    if (processed.has(property.id)) continue;

    // Find all duplicates by phone number (most reliable)
    const duplicates = properties.filter(p => 
      p.ownerPhone && property.ownerPhone && 
      p.ownerPhone === property.ownerPhone &&
      p.address.toLowerCase().includes(property.address.toLowerCase().substring(0, 10))
    );

    if (duplicates.length > 1) {
      // Merge all duplicates into one property with most complete data
      const mergedProperty: ConsolidatedProperty = {
        ...property,
        // Take the most complete address
        address: duplicates.reduce((best, curr) => 
          curr.address.length > best.length ? curr.address : best, property.address),
        // Take the most complete owner name
        ownerName: duplicates.reduce((best, curr) => 
          curr.ownerName.length > best.length ? curr.ownerName : best, property.ownerName),
        // Combine data sources
        dataSource: 'consolidated' as const,
        // Take non-null values where available
        ownerEmail: duplicates.find(d => d.ownerEmail)?.ownerEmail || property.ownerEmail,
        tenantName: duplicates.find(d => d.tenantName)?.tenantName || property.tenantName,
        tenantPhone: duplicates.find(d => d.tenantPhone)?.tenantPhone || property.tenantPhone,
        monthlyRent: duplicates.find(d => d.monthlyRent)?.monthlyRent || property.monthlyRent,
        propertySize: duplicates.find(d => d.propertySize)?.propertySize || property.propertySize,
        rooms: duplicates.find(d => d.rooms)?.rooms || property.rooms,
        floor: duplicates.find(d => d.floor)?.floor || property.floor,
        notes: duplicates.map(d => d.notes).filter(Boolean).join(' | ') || property.notes,
      };
      
      merged.push(mergedProperty);
      duplicates.forEach(d => processed.add(d.id));
    } else {
      merged.push(property);
      processed.add(property.id);
    }
  }

  return merged;
}

// Convert consolidated data to Supabase format
function convertToSupabaseFormat(properties: ConsolidatedProperty[]) {
  const dbProperties = properties.map(p => ({
    id: crypto.randomUUID(),
    address: p.address,
    city: p.city,
    status: p.status || 'unknown',
    contact_status: p.contactStatus || 'not_contacted',
    contact_attempts: p.contactAttempts || 0,
    last_contact_date: p.lastContactDate ? new Date(p.lastContactDate).toISOString() : null,
    contact_notes: p.contactNotes || null,
    property_size: p.propertySize || null,
    floor: p.floor || null,
    rooms: p.rooms || null,
    notes: p.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const dbOwners = properties.map(p => ({
    id: crypto.randomUUID(),
    name: p.ownerName,
    phone: p.ownerPhone || null,
    email: p.ownerEmail || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // Remove duplicate owners by phone/name
  const uniqueOwners = dbOwners.filter((owner, index, self) => 
    index === self.findIndex(o => 
      (owner.phone && o.phone === owner.phone) || 
      (o.name === owner.name && !owner.phone && !o.phone)
    )
  );

  const propertyOwnerLinks = properties.map((p, index) => {
    const propertyId = dbProperties[index].id;
    const owner = uniqueOwners.find(o => 
      (o.phone && o.phone === p.ownerPhone) || 
      (o.name === p.ownerName && !o.phone && !p.ownerPhone)
    );
    return {
      property_id: propertyId,
      owner_id: owner?.id || crypto.randomUUID(),
      ownership_percentage: 100,
      created_at: new Date().toISOString(),
    };
  });

  const dbTenants = properties
    .filter(p => p.tenantName)
    .map((p, index) => ({
      id: crypto.randomUUID(),
      property_id: dbProperties[index].id,
      name: p.tenantName!,
      phone: p.tenantPhone || null,
      email: p.tenantEmail || null,
      monthly_rent: p.monthlyRent || null,
      lease_start_date: p.leaseStartDate ? new Date(p.leaseStartDate).toISOString().split('T')[0] : null,
      lease_end_date: p.leaseEndDate ? new Date(p.leaseEndDate).toISOString().split('T')[0] : null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

  return { dbProperties, uniqueOwners, propertyOwnerLinks, dbTenants };
}

export async function performFullDataMigration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    propertiesInserted: 0,
    ownersInserted: 0,
    ownershipLinksCreated: 0,
    duplicatesRemoved: 0,
    errors: []
  };

  try {
    log.info('Starting full data consolidation and migration...');

    // Step 1: Consolidate all data
    const consolidationResult = await consolidateAllPropertyData();
    log.info(`Consolidated ${consolidationResult.properties.length} properties from all sources`);

    // Step 2: Merge duplicates intelligently
    const originalCount = consolidationResult.properties.length;
    const mergedProperties = mergeDuplicateProperties(consolidationResult.properties);
    result.duplicatesRemoved = originalCount - mergedProperties.length;
    log.info(`Removed ${result.duplicatesRemoved} duplicate properties`);

    // Step 3: Convert to Supabase format
    const { dbProperties, uniqueOwners, propertyOwnerLinks, dbTenants } = convertToSupabaseFormat(mergedProperties);
    log.info(`Prepared ${dbProperties.length} properties, ${uniqueOwners.length} owners, ${dbTenants.length} tenants for migration`);

    // Step 4: Clear existing data (optional - comment out if you want to keep existing data)
    // await supabase.from('property_owners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // await supabase.from('tenants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // await supabase.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Step 5: Insert owners first
    const { error: ownersError } = await supabase
      .from('profiles')
      .upsert(uniqueOwners.map(owner => ({
        id: owner.id,
        email: owner.email || `${owner.name.replace(/\\s+/g, '').toLowerCase()}@example.com`,
        full_name: owner.name,
        phone: owner.phone,
        role: 'property_owner',
        is_approved: true,
      })), { onConflict: 'email' });

    if (ownersError) {
      result.errors.push(`Failed to insert owners: ${ownersError.message}`);
    } else {
      result.ownersInserted = uniqueOwners.length;
      log.info(`Inserted ${result.ownersInserted} owners`);
    }

    // Step 6: Insert properties
    const { error: propertiesError } = await supabase
      .from('properties')
      .insert(dbProperties);

    if (propertiesError) {
      result.errors.push(`Failed to insert properties: ${propertiesError.message}`);
    } else {
      result.propertiesInserted = dbProperties.length;
      log.info(`Inserted ${result.propertiesInserted} properties`);
    }

    // Step 7: Create property-owner relationships
    const { error: linksError } = await supabase
      .from('property_owners')
      .insert(propertyOwnerLinks);

    if (linksError) {
      result.errors.push(`Failed to create property-owner links: ${linksError.message}`);
    } else {
      result.ownershipLinksCreated = propertyOwnerLinks.length;
      log.info(`Created ${result.ownershipLinksCreated} property-owner relationships`);
    }

    // Step 8: Insert tenants
    if (dbTenants.length > 0) {
      const { error: tenantsError } = await supabase
        .from('tenants')
        .insert(dbTenants);

      if (tenantsError) {
        result.errors.push(`Failed to insert tenants: ${tenantsError.message}`);
      } else {
        log.info(`Inserted ${dbTenants.length} tenants`);
      }
    }

    result.success = result.errors.length === 0;
    
    if (result.success) {
      log.info('Full data migration completed successfully!', result);
    } else {
      log.error('Data migration completed with errors', result);
    }

    return result;

  } catch (error) {
    log.error('Fatal error during data migration:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
    return result;
  }
}
