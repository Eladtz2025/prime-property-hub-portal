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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🧹 Starting orphan duplicate groups cleanup...');

    // Call the RPC function that cleans up orphan duplicate groups
    const { data: cleanedCount, error } = await supabase.rpc('cleanup_orphan_duplicate_groups');

    if (error) {
      throw error;
    }

    console.log(`✅ Cleanup complete: ${cleanedCount} orphan groups cleaned`);

    return new Response(JSON.stringify({
      success: true,
      cleaned_count: cleanedCount,
      message: `Cleaned ${cleanedCount} orphan duplicate groups`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
