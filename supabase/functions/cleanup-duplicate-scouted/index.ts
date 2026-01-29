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
    const dryRun = body.dry_run !== false;
    const batchSize = body.batch_size || 100; // Process fewer URLs per batch

    console.log(`🧹 Starting duplicate cleanup (dry_run: ${dryRun}, batch_size: ${batchSize})`);

    // Use a more efficient SQL approach to find duplicates
    // Get URLs that appear more than once, with count
    const { data: duplicateUrls, error: dupError } = await supabase.rpc('get_duplicate_scouted_urls');
    
    if (dupError) {
      // If RPC doesn't exist, fall back to manual approach but with limit
      console.log('RPC not found, using fallback approach...');
      
      // Get a sample of duplicate URLs to process
      const { data: sampleData, error: sampleError } = await supabase
        .from('scouted_properties')
        .select('source_url')
        .not('source_url', 'is', null)
        .neq('source_url', '')
        .limit(5000);

      if (sampleError) throw sampleError;

      // Count duplicates
      const urlCounts = new Map<string, number>();
      for (const record of sampleData || []) {
        urlCounts.set(record.source_url, (urlCounts.get(record.source_url) || 0) + 1);
      }

      const duplicateUrlsList = Array.from(urlCounts.entries())
        .filter(([_, count]) => count > 1)
        .slice(0, batchSize)
        .map(([url, count]) => ({ url, count }));

      if (duplicateUrlsList.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'No duplicates found in sample',
          duplicate_urls: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (dryRun) {
        return new Response(JSON.stringify({
          success: true,
          dry_run: true,
          duplicate_urls_in_batch: duplicateUrlsList.length,
          sample_duplicates: duplicateUrlsList.slice(0, 10),
          message: `Found ${duplicateUrlsList.length} duplicate URLs in this batch. Set dry_run: false to delete.`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Delete duplicates one URL at a time, keeping oldest
      let totalDeleted = 0;
      
      for (const { url } of duplicateUrlsList) {
        // Get all records for this URL, ordered by created_at
        const { data: records, error: fetchError } = await supabase
          .from('scouted_properties')
          .select('id, created_at')
          .eq('source_url', url)
          .order('created_at', { ascending: true });

        if (fetchError || !records || records.length <= 1) continue;

        // Keep the first (oldest), delete the rest
        const idsToDelete = records.slice(1).map(r => r.id);
        
        const { error: deleteError } = await supabase
          .from('scouted_properties')
          .delete()
          .in('id', idsToDelete);

        if (!deleteError) {
          totalDeleted += idsToDelete.length;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        dry_run: false,
        duplicate_urls_processed: duplicateUrlsList.length,
        records_deleted: totalDeleted,
        message: `Deleted ${totalDeleted} duplicate records. Run again to process more.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If RPC exists, use it
    return new Response(JSON.stringify({
      success: true,
      data: duplicateUrls
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
