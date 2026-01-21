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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting lead eligibility refresh...');

    // Fetch eligibility settings
    const { data: settings } = await supabase
      .from('scout_settings')
      .select('setting_key, setting_value')
      .eq('category', 'eligibility');

    const requireCities = settings?.find(s => s.setting_key === 'require_cities')?.setting_value !== 'false';
    const requireNeighborhoods = settings?.find(s => s.setting_key === 'require_neighborhoods')?.setting_value !== 'false';
    const requireBudget = settings?.find(s => s.setting_key === 'require_budget')?.setting_value !== 'false';
    const requireRooms = settings?.find(s => s.setting_key === 'require_rooms')?.setting_value !== 'false';

    console.log('Eligibility settings:', { requireCities, requireNeighborhoods, requireBudget, requireRooms });

    // Build dynamic eligibility check
    // Using a simple touch-update to trigger the DB trigger for all leads
    const { data: leads, error: fetchError } = await supabase
      .from('contact_leads')
      .select('id')
      .eq('is_hidden', false);

    if (fetchError) throw fetchError;

    console.log(`Found ${leads?.length || 0} leads to refresh`);

    let updated = 0;
    let errors = 0;

    // Update leads in batches to trigger the eligibility trigger
    const batchSize = 50;
    for (let i = 0; i < (leads?.length || 0); i += batchSize) {
      const batch = leads!.slice(i, i + batchSize);
      const ids = batch.map(l => l.id);

      // Touch update to trigger the eligibility trigger
      const { error: updateError } = await supabase
        .from('contact_leads')
        .update({ updated_at: new Date().toISOString() })
        .in('id', ids);

      if (updateError) {
        console.error(`Batch ${i / batchSize + 1} error:`, updateError);
        errors += batch.length;
      } else {
        updated += batch.length;
      }
    }

    console.log(`Refresh complete: ${updated} updated, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        errors,
        settings: { requireCities, requireNeighborhoods, requireBudget, requireRooms }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error refreshing lead eligibility:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
