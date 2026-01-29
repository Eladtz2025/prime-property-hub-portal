import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false; // Default to dry run for safety

    console.log(`🧹 Starting duplicate cleanup (dry_run: ${dryRun})`);

    // Step 1: Fetch ALL source_urls using pagination to bypass 1000 limit
    const allUrls: string[] = [];
    let offset = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('scouted_properties')
        .select('source_url')
        .not('source_url', 'is', null)
        .neq('source_url', '')
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        for (const record of data) {
          allUrls.push(record.source_url);
        }
        offset += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    console.log(`Fetched ${allUrls.length} total records`);

    // Count duplicates manually
    const urlCounts = new Map<string, number>();
    for (const url of allUrls) {
      urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
    }

    // Filter to only duplicates
    const duplicateUrlsList = Array.from(urlCounts.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([url, count]) => ({ url, count }));

    const totalDuplicatesToDelete = duplicateUrlsList.reduce((sum, item) => sum + item.count - 1, 0);

    console.log(`Found ${duplicateUrlsList.length} duplicate URLs, ${totalDuplicatesToDelete} records to delete`);

    if (duplicateUrlsList.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No duplicates found',
        duplicate_urls: 0,
        records_to_delete: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (dryRun) {
      return new Response(JSON.stringify({
        success: true,
        dry_run: true,
        duplicate_urls: duplicateUrlsList.length,
        records_to_delete: totalDuplicatesToDelete,
        top_duplicates: duplicateUrlsList.slice(0, 20),
        message: 'Dry run complete. Set dry_run: false to execute deletion.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 2: For each duplicate URL, get all IDs and keep only the oldest
    const idsToDelete: string[] = [];
    let processedUrls = 0;

    for (const { url } of duplicateUrlsList) {
      const { data: records, error: fetchError } = await supabase
        .from('scouted_properties')
        .select('id, created_at')
        .eq('source_url', url)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error(`Error fetching records for URL: ${url}`, fetchError);
        continue;
      }

      if (records && records.length > 1) {
        // Skip the first (oldest), delete the rest
        for (let i = 1; i < records.length; i++) {
          idsToDelete.push(records[i].id);
        }
      }

      processedUrls++;
      if (processedUrls % 100 === 0) {
        console.log(`Processed ${processedUrls}/${duplicateUrlsList.length} URLs`);
      }
    }

    console.log(`Total records to delete: ${idsToDelete.length}`);

    // Delete in batches of 500
    let deletedCount = 0;
    const batchSize = 500;

    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);
      
      const { error: deleteError } = await supabase
        .from('scouted_properties')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error(`Error deleting batch ${i / batchSize + 1}:`, deleteError);
        throw deleteError;
      }

      deletedCount += batch.length;
      console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}: ${deletedCount}/${idsToDelete.length}`);
    }

    return new Response(JSON.stringify({
      success: true,
      dry_run: false,
      duplicate_urls: duplicateUrlsList.length,
      records_deleted: deletedCount,
      message: `Successfully deleted ${deletedCount} duplicate records`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
