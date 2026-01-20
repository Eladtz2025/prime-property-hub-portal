import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { fetchScoutSettings } from '../_shared/settings.ts';

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

    const { config_id } = await req.json();

    if (!config_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'config_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the config to determine source
    const { data: config, error: configError } = await supabase
      .from('scout_configs')
      .select('id, name, source')
      .eq('id', config_id)
      .single();

    if (configError || !config) {
      console.error('❌ Config not found:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'Config not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🚀 Trigger Scout Pages - Config: ${config.name} (${config.source})`);

    // Fetch settings to get pages per source
    const settings = await fetchScoutSettings(supabase);
    
    // Determine pages to scan based on source from settings
    let pagesToScan: number;
    switch (config.source) {
      case 'yad2':
        pagesToScan = settings.scraping.yad2_pages;
        break;
      case 'madlan':
        pagesToScan = settings.scraping.madlan_pages;
        break;
      case 'homeless':
        pagesToScan = settings.scraping.homeless_pages || 5;
        break;
      default:
        pagesToScan = 7;
    }
    
    const triggeredPages: number[] = [];

    console.log(`📄 Triggering ${pagesToScan} page scans for: ${config.name} (${config.source}) [from settings]`);

    for (let page = 1; page <= pagesToScan; page++) {
      try {
        console.log(`🔄 Triggering page ${page}/${pagesToScan} for: ${config.name}`);
        
        // Fire and forget - don't await the response
        fetch(`${supabaseUrl}/functions/v1/scout-properties`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            config_id: config.id,
            page: page
          }),
        }).catch(err => {
          console.error(`❌ Failed to trigger page ${page}:`, err);
        });

        triggeredPages.push(page);
        
        // 2 second delay between page triggers to prevent overload
        if (page < pagesToScan) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (err) {
        console.error(`❌ Error triggering page ${page}:`, err);
      }
    }

    console.log(`✅ Triggered ${triggeredPages.length} page scans for ${config.name}`);

    return new Response(
      JSON.stringify({
        success: true,
        config: config.name,
        source: config.source,
        mode: 'distributed',
        pages_triggered: triggeredPages.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Trigger Scout Pages failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
