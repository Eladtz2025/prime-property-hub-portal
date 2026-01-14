import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Trigger Scout All - Starting');

    // Get all active scout configs
    const { data: configs, error: configError } = await supabase
      .from('scout_configs')
      .select('id, name, source')
      .eq('is_active', true);

    if (configError) {
      console.error('❌ Error fetching configs:', configError);
      throw configError;
    }

    if (!configs || configs.length === 0) {
      console.log('⚠️ No active scout configs found');
      return new Response(
        JSON.stringify({ success: true, message: 'No active configs', triggered: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${configs.length} active configs:`, configs.map(c => c.name));

    const triggered: string[] = [];
    const errors: string[] = [];

    // Trigger scout-properties for each config separately (fire and forget)
    for (const config of configs) {
      try {
        console.log(`🔄 Triggering scan for: ${config.name} (${config.id})`);
        
        // Fire and forget - don't await the response
        fetch(`${supabaseUrl}/functions/v1/scout-properties`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ config_id: config.id }),
        }).catch(err => {
          console.error(`❌ Failed to trigger ${config.name}:`, err);
        });

        triggered.push(config.name);
        
        // Small delay between triggers to prevent overload
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (err) {
        console.error(`❌ Error triggering ${config.name}:`, err);
        errors.push(`${config.name}: ${err.message}`);
      }
    }

    console.log(`✅ Triggered ${triggered.length} scans:`, triggered);
    if (errors.length > 0) {
      console.log(`⚠️ Errors:`, errors);
    }

    return new Response(
      JSON.stringify({
        success: true,
        triggered: triggered.length,
        configs: triggered,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Trigger Scout All failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
