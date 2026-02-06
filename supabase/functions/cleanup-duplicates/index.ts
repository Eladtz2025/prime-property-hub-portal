import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Extract listing ID from URL based on source
 * Used to identify same-source duplicates with different tracking parameters
 */
function extractListingId(url: string, source: string): string | null {
  if (!url) return null;
  
  if (source === 'yad2') {
    // /realestate/item/abc123 or /realestate/item/tel-aviv-area/abc123
    const match = url.match(/\/realestate\/item\/(?:[^\/]+\/)?([a-zA-Z0-9]+)/i);
    return match ? match[1] : null;
  }
  
  if (source === 'madlan') {
    // /listings/ABC123 → ABC123
    const match = url.match(/\/listings?\/([a-zA-Z0-9]+)/i);
    return match ? match[1] : null;
  }
  
  if (source === 'homeless') {
    // viewad,12345 or adid=12345 → 12345
    const match = url.match(/(?:viewad[,/]|adid=)(\d+)/i);
    return match ? match[1] : null;
  }
  
  return null;
}

interface DuplicateGroup {
  listingId: string;
  source: string;
  properties: {
    id: string;
    source_url: string;
    created_at: string;
    address: string | null;
  }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    let execute = false;
    try {
      const body = await req.json();
      execute = body.execute === true;
    } catch {
      // No body or invalid JSON - default to dry run
    }

    console.log(`🧹 Starting duplicate cleanup (execute: ${execute})`);

    // Step 1: Get all active properties with their listing IDs (with pagination)
    const allProperties: any[] = [];
    let offset = 0;
    const batchSize = 1000;
    
    while (true) {
      const { data: batch, error: fetchError } = await supabase
        .from('scouted_properties')
        .select('id, source, source_url, created_at, address')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (fetchError) {
        throw new Error(`Failed to fetch properties: ${fetchError.message}`);
      }
      
      if (!batch || batch.length === 0) break;
      
      allProperties.push(...batch);
      offset += batchSize;
      
      if (batch.length < batchSize) break;
    }

    const properties = allProperties;

    console.log(`📊 Found ${properties.length} active properties`);

    // Step 2: Group by source + listingId
    const groups = new Map<string, DuplicateGroup>();
    
    for (const prop of properties || []) {
      const listingId = extractListingId(prop.source_url, prop.source);
      if (!listingId) continue;
      
      const key = `${prop.source}:${listingId}`;
      
      if (!groups.has(key)) {
        groups.set(key, {
          listingId,
          source: prop.source,
          properties: []
        });
      }
      
      groups.get(key)!.properties.push({
        id: prop.id,
        source_url: prop.source_url,
        created_at: prop.created_at,
        address: prop.address
      });
    }

    // Step 3: Find groups with duplicates (more than 1 property)
    const duplicateGroups: DuplicateGroup[] = [];
    for (const group of groups.values()) {
      if (group.properties.length > 1) {
        duplicateGroups.push(group);
      }
    }

    console.log(`🔍 Found ${duplicateGroups.length} groups with duplicates`);

    // Step 4: Prepare deletion list (keep first, delete rest)
    const toDelete: { id: string; source_url: string; reason: string }[] = [];
    const toKeep: { id: string; source_url: string; address: string | null }[] = [];

    for (const group of duplicateGroups) {
      // Sort by created_at to keep the oldest
      group.properties.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      const [primary, ...duplicates] = group.properties;
      toKeep.push({
        id: primary.id,
        source_url: primary.source_url,
        address: primary.address
      });
      
      for (const dup of duplicates) {
        toDelete.push({
          id: dup.id,
          source_url: dup.source_url,
          reason: `Duplicate of ${primary.source_url} (same listing ID: ${group.listingId})`
        });
      }
    }

    console.log(`📋 Properties to delete: ${toDelete.length}`);
    console.log(`✅ Properties to keep: ${toKeep.length}`);

    // Step 5: Execute deletion if requested
    let deletedCount = 0;
    const errors: string[] = [];

    if (execute && toDelete.length > 0) {
      console.log('🗑️ Executing deletion...');
      
      const deleteIds = toDelete.map(d => d.id);
      
      // Delete in batches of 100
      for (let i = 0; i < deleteIds.length; i += 100) {
        const batch = deleteIds.slice(i, i + 100);
        const { error: deleteError, count } = await supabase
          .from('scouted_properties')
          .delete()
          .in('id', batch);
        
        if (deleteError) {
          errors.push(`Batch ${i / 100 + 1}: ${deleteError.message}`);
        } else {
          deletedCount += count || batch.length;
        }
      }

      console.log(`✅ Deleted ${deletedCount} properties`);

      // Step 6: Clean up orphaned duplicate_group_ids
      // Find groups with only one property left
      const { error: cleanupError } = await supabase
        .from('scouted_properties')
        .update({ 
          duplicate_group_id: null,
          is_primary_listing: true,
          duplicate_detected_at: null
        })
        .not('duplicate_group_id', 'is', null)
        .eq('is_active', true);

      if (cleanupError) {
        console.warn(`⚠️ Cleanup warning: ${cleanupError.message}`);
      }
    }

    // Return results
    const result = {
      mode: execute ? 'execute' : 'dry_run',
      summary: {
        total_active_properties: properties?.length || 0,
        duplicate_groups_found: duplicateGroups.length,
        properties_to_delete: toDelete.length,
        properties_deleted: deletedCount
      },
      to_delete: toDelete.slice(0, 50), // Limit to 50 examples
      to_keep: toKeep.slice(0, 20), // Limit to 20 examples
      errors: errors.length > 0 ? errors : undefined,
      message: execute 
        ? `Successfully deleted ${deletedCount} duplicate properties`
        : `Dry run complete. Found ${toDelete.length} duplicates to delete. Run with {\"execute\": true} to delete.`
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

