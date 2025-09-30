import { supabase } from '../_shared/supabase.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
    sources: Record<string, number>;
  };
  properties: UnifiedProperty[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting property import from storage...');

    // Download the JSON file from storage
    console.log('Downloading properties-unified.json from storage...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('data-import')
      .download('properties-unified.json');

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download properties file', details: downloadError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert blob to text and parse JSON
    const fileText = await fileData.text();
    const data: UnifiedDataFile = JSON.parse(fileText);
    
    console.log(`Loaded ${data.properties.length} properties from file`);
    console.log('Metadata:', data.metadata);

    // Clear existing data in the correct order (respecting foreign key constraints)
    console.log('Clearing existing data...');
    
    // Delete property_owners first (has foreign keys to properties and profiles)
    const { error: clearOwnersError } = await supabase
      .from('property_owners')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (clearOwnersError) {
      console.error('Error clearing property_owners:', clearOwnersError);
    }

    // Delete properties
    const { error: clearPropertiesError } = await supabase
      .from('properties')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (clearPropertiesError) {
      console.error('Error clearing properties:', clearPropertiesError);
    }

    // Delete profiles (except admin users)
    const { error: clearProfilesError } = await supabase
      .from('profiles')
      .delete()
      .not('role', 'in', '(super_admin,admin)');

    if (clearProfilesError) {
      console.error('Error clearing profiles:', clearProfilesError);
    }

    console.log('Existing data cleared successfully');

    // Helper function to clean phone numbers
    const cleanPhoneNumber = (phone: string): string => {
      if (!phone || phone === 'nan' || phone === '—') return '';
      
      const phoneNumbers = phone.split(' / ').map(num => {
        const cleaned = num.trim().replace(/[^\d]/g, '');
        
        if (cleaned.length === 10 && cleaned.startsWith('05')) {
          return `0${cleaned.substring(1)}`;
        } else if (cleaned.length === 9 && cleaned.startsWith('5')) {
          return `0${cleaned}`;
        } else if (cleaned.length === 10) {
          return cleaned;
        }
        
        return cleaned;
      }).filter(num => num.length >= 9);
      
      return phoneNumbers[0] || '';
    };

    // Process properties in batches
    const batchSize = 100;
    const ownerPhoneToIdMap = new Map<string, string>();
    let totalProcessed = 0;

    for (let i = 0; i < data.properties.length; i += batchSize) {
      const batch = data.properties.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.properties.length / batchSize)}`);

      // Create owner profiles for this batch
      const newOwners: any[] = [];
      const propertiesToInsert: any[] = [];
      const ownershipRecords: any[] = [];

      for (const property of batch) {
        const cleanOwnerPhone = cleanPhoneNumber(property.owner_phone);
        
        if (cleanOwnerPhone && !ownerPhoneToIdMap.has(cleanOwnerPhone)) {
          const ownerId = crypto.randomUUID();
          ownerPhoneToIdMap.set(cleanOwnerPhone, ownerId);
          
          newOwners.push({
            id: ownerId,
            email: `${cleanOwnerPhone}@temp.com`,
            full_name: property.owner_name || 'Unknown Owner',
            phone: cleanOwnerPhone,
            role: 'property_owner',
            is_approved: true
          });
        }

        // Create property record
        const propertyId = crypto.randomUUID();
        propertiesToInsert.push({
          id: propertyId,
          address: property.address,
          city: property.city,
          notes: property.notes || '',
          status: 'unknown',
          contact_status: 'not_contacted',
          contact_attempts: 0
        });

        // Create ownership record if owner has valid phone
        if (cleanOwnerPhone && ownerPhoneToIdMap.has(cleanOwnerPhone)) {
          ownershipRecords.push({
            property_id: propertyId,
            owner_id: ownerPhoneToIdMap.get(cleanOwnerPhone),
            ownership_percentage: 100
          });
        }
      }

      // Insert new owner profiles
      if (newOwners.length > 0) {
        const { error: profilesError } = await supabase
          .from('profiles')
          .insert(newOwners);

        if (profilesError) {
          console.error('Error inserting profiles:', profilesError);
          throw profilesError;
        }
      }

      // Insert properties
      const { error: propertiesError } = await supabase
        .from('properties')
        .insert(propertiesToInsert);

      if (propertiesError) {
        console.error('Error inserting properties:', propertiesError);
        throw propertiesError;
      }

      // Insert ownership records
      if (ownershipRecords.length > 0) {
        const { error: ownershipError } = await supabase
          .from('property_owners')
          .insert(ownershipRecords);

        if (ownershipError) {
          console.error('Error inserting property ownership:', ownershipError);
          throw ownershipError;
        }
      }

      totalProcessed += batch.length;
      console.log(`Processed ${totalProcessed}/${data.properties.length} properties`);
    }

    // Get final counts
    const { count: finalPropertiesCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    const { count: finalOwnersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'property_owner');

    const { count: finalOwnershipCount } = await supabase
      .from('property_owners')
      .select('*', { count: 'exact', head: true });

    console.log('Import completed successfully!');
    console.log(`Final counts: ${finalPropertiesCount} properties, ${finalOwnersCount} owners, ${finalOwnershipCount} ownership records`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Properties imported successfully from storage',
        statistics: {
          properties_imported: finalPropertiesCount,
          owners_created: finalOwnersCount,
          ownership_records: finalOwnershipCount,
          total_processed: totalProcessed
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Import failed', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});