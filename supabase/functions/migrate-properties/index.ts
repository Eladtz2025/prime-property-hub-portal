import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnifiedProperty {
  address: string;
  owner_name: string;
  owner_phone: string;
  tenant_name?: string;
  tenant_phone?: string;
  city: string;
  notes?: string;
}

interface UnifiedDataFile {
  metadata: {
    created_at: string;
    total_properties: number;
    source_breakdown: {
      main_file_records: number;
      owners_file_records: number;
      total_before_dedup: number;
      duplicates_removed: number;
    };
  };
  properties: UnifiedProperty[];
}

serve(async (req) => {
  console.log('Migration function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting property migration...');

    // Step 1: Read the unified JSON file
    console.log('Reading properties-unified.json...');
    const jsonResponse = await fetch('https://jswumsdymlooeobrxict.supabase.co/storage/v1/object/public/properties-unified.json');
    
    if (!jsonResponse.ok) {
      // Try reading from the public folder instead
      const localResponse = await fetch('http://localhost:5173/properties-unified.json');
      if (!localResponse.ok) {
        throw new Error('Could not fetch properties-unified.json');
      }
      const data: UnifiedDataFile = await localResponse.json();
      console.log(`Loaded ${data.properties.length} properties from local file`);
    } else {
      const data: UnifiedDataFile = await jsonResponse.json();
      console.log(`Loaded ${data.properties.length} properties from storage`);
    }

    // Read from local file for now
    const response = await fetch('http://localhost:5173/properties-unified.json');
    if (!response.ok) {
      throw new Error('Could not fetch properties-unified.json from localhost');
    }
    const data: UnifiedDataFile = await response.json();
    console.log(`Successfully loaded ${data.properties.length} properties`);

    // Step 2: Clear existing data
    console.log('Clearing existing data...');
    
    // Delete existing property owners
    const { error: deleteOwnersError } = await supabase
      .from('property_owners')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteOwnersError) {
      console.error('Error deleting property owners:', deleteOwnersError);
    } else {
      console.log('Deleted existing property owners');
    }

    // Delete existing properties
    const { error: deletePropertiesError } = await supabase
      .from('properties')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deletePropertiesError) {
      console.error('Error deleting properties:', deletePropertiesError);
    } else {
      console.log('Deleted existing properties');
    }

    // Delete existing user_roles for property_owner
    const { error: deleteRolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('role', 'property_owner');
    
    if (deleteRolesError) {
      console.error('Error deleting user_roles:', deleteRolesError);
    } else {
      console.log('Deleted existing property owner roles');
    }
    
    // Delete existing profiles (except admins by checking user_roles)
    const { data: adminUsers } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['super_admin', 'admin', 'manager']);
    
    const adminIds = adminUsers?.map(u => u.user_id) || [];
    
    if (adminIds.length > 0) {
      const { error: deleteProfilesError } = await supabase
        .from('profiles')
        .delete()
        .not('id', 'in', `(${adminIds.map(id => `'${id}'`).join(',')})`);
      
      if (deleteProfilesError) {
        console.error('Error deleting profiles:', deleteProfilesError);
      } else {
        console.log('Deleted existing property owner profiles');
      }
    }

    // Step 3: Process properties in batches
    const batchSize = 100;
    const properties = data.properties;
    let processedCount = 0;
    const ownerProfiles = new Map<string, string>(); // phone -> profile_id

    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(properties.length/batchSize)} (${batch.length} properties)`);

      // Create owner profiles for this batch
      const newOwners = [];
      for (const property of batch) {
        if (!ownerProfiles.has(property.owner_phone)) {
          const ownerId = crypto.randomUUID();
          ownerProfiles.set(property.owner_phone, ownerId);
          
          newOwners.push({
            id: ownerId,
            email: `owner-${property.owner_phone.replace(/[^0-9]/g, '')}@temp.com`,
            full_name: property.owner_name,
            phone: property.owner_phone,
            is_approved: true
          });
        }
      }

      // Insert new owner profiles (without role column)
      if (newOwners.length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert(newOwners);
        
        if (profileError) {
          console.error('Error inserting profiles:', profileError);
          continue;
        }
        
        // Insert roles into user_roles table
        const roleInserts = newOwners.map(owner => ({
          user_id: owner.id,
          role: 'property_owner'
        }));
        
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert(roleInserts);
        
        if (roleError) {
          console.error('Error inserting user_roles:', roleError);
          continue;
        }
        
        console.log(`Created ${newOwners.length} new owner profiles and roles`);
      }

      // Insert properties
      const propertiesToInsert = batch.map(property => ({
        address: property.address,
        city: property.city,
        notes: property.notes || null,
        status: 'unknown',
        contact_status: 'not_contacted',
        contact_attempts: 0
      }));

      const { data: insertedProperties, error: propertyError } = await supabase
        .from('properties')
        .insert(propertiesToInsert)
        .select('id, address');

      if (propertyError) {
        console.error('Error inserting properties:', propertyError);
        continue;
      }

      // Create property ownership relationships
      const ownershipData = [];
      for (let j = 0; j < batch.length; j++) {
        const property = batch[j];
        const insertedProperty = insertedProperties[j];
        const ownerId = ownerProfiles.get(property.owner_phone);
        
        if (ownerId && insertedProperty) {
          ownershipData.push({
            property_id: insertedProperty.id,
            owner_id: ownerId,
            ownership_percentage: 100
          });
        }
      }

      if (ownershipData.length > 0) {
        const { error: ownershipError } = await supabase
          .from('property_owners')
          .insert(ownershipData);
        
        if (ownershipError) {
          console.error('Error creating ownership relationships:', ownershipError);
        } else {
          console.log(`Created ${ownershipData.length} ownership relationships`);
        }
      }

      processedCount += batch.length;
      console.log(`Processed ${processedCount}/${properties.length} properties`);
    }

    // Final verification
    const { count: finalPropertyCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    const { count: finalProfileCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'property_owner');

    const { count: finalOwnershipCount } = await supabase
      .from('property_owners')
      .select('*', { count: 'exact', head: true });

    console.log(`Migration completed successfully!`);
    console.log(`Final counts: ${finalPropertyCount} properties, ${finalProfileCount} owners, ${finalOwnershipCount} relationships`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Migration completed successfully',
      stats: {
        properties_migrated: finalPropertyCount,
        owners_created: finalProfileCount,
        relationships_created: finalOwnershipCount,
        unique_owners: ownerProfiles.size
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});