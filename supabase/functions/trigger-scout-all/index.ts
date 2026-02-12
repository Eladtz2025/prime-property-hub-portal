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

    // Fire-and-forget cleanup of stuck runs before starting
    fetch(`${supabaseUrl}/functions/v1/cleanup-stuck-runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }).catch(err => console.error('⚠️ Cleanup-stuck-runs failed:', err));

    // Get current time in Israel (HH:MM format)
    const israelTime = new Date().toLocaleTimeString('he-IL', { 
      timeZone: 'Asia/Jerusalem',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    console.log('='.repeat(60));
    console.log('🚀 TRIGGER SCOUT ALL - SCHEDULE CHECK');
    console.log(`📅 UTC: ${new Date().toISOString()}`);
    console.log(`🕐 Israel time: ${israelTime}`);
    console.log('='.repeat(60));

    // Get all active scout configs WITH schedule_times
    const { data: allConfigs, error: configError } = await supabase
      .from('scout_configs')
      .select('id, name, source, schedule_times')
      .eq('is_active', true);

    if (configError) {
      console.error('❌ Error fetching configs:', configError);
      throw configError;
    }

    if (!allConfigs || allConfigs.length === 0) {
      console.log('⚠️ No active scout configs found');
      return new Response(
        JSON.stringify({ success: true, message: 'No active configs', triggered: 0, currentTime: israelTime }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter: only run configs scheduled for the current time
    const configs = allConfigs.filter(config => {
      if (!config.schedule_times || config.schedule_times.length === 0) {
        console.log(`⏭️ ${config.name}: no schedule_times defined - skipping`);
        return false;
      }
      
      const shouldRun = config.schedule_times.includes(israelTime);
      console.log(`${shouldRun ? '✅' : '⏭️'} ${config.name}: scheduled for [${config.schedule_times.join(', ')}] | now: ${israelTime}`);
      return shouldRun;
    });

    if (configs.length === 0) {
      console.log(`📭 No configs scheduled for ${israelTime}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `No configs scheduled for ${israelTime}`, 
          triggered: 0,
          currentTime: israelTime,
          checkedConfigs: allConfigs.map(c => ({ name: c.name, schedule_times: c.schedule_times }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Running ${configs.length} configs scheduled for ${israelTime}:`, configs.map(c => c.name));

    const triggered: string[] = [];
    const errors: string[] = [];

    // Trigger trigger-scout-pages for each config (handles distributed scanning for Yad2)
    for (const config of configs) {
      try {
        console.log(`🔄 Triggering scan for: ${config.name} (${config.id}) via trigger-scout-pages`);
        
        // Fire and forget - calls trigger-scout-pages which handles page distribution
        fetch(`${supabaseUrl}/functions/v1/trigger-scout-pages`, {
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
