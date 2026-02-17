import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { isProcessEnabled } from '../_shared/process-flags.ts';

/**
 * Cron entry point for Jina-based scanning
 * Clone of trigger-scout-all with kill switch process_scans_jina
 * and calls to trigger-scout-pages-jina
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Kill switch: process_scans_jina
    if (!await isProcessEnabled(supabase, 'scans_jina')) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Process disabled via kill switch' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fire-and-forget cleanup of stuck runs
    fetch(`${supabaseUrl}/functions/v1/cleanup-stuck-runs`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).catch(err => console.error('⚠️ Cleanup-stuck-runs failed:', err));

    const israelTime = new Date().toLocaleTimeString('he-IL', {
      timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hour12: false
    });

    console.log('='.repeat(60));
    console.log('🚀 TRIGGER SCOUT ALL JINA - SCHEDULE CHECK');
    console.log(`🕐 Israel time: ${israelTime}`);
    console.log('='.repeat(60));

    const { data: allConfigs, error: configError } = await supabase
      .from('scout_configs')
      .select('id, name, source, schedule_times')
      .eq('is_active', true);

    if (configError) throw configError;
    if (!allConfigs?.length) {
      return new Response(JSON.stringify({ success: true, message: 'No active configs', triggered: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const configs = allConfigs.filter(config => {
      if (!config.schedule_times?.length) return false;
      const shouldRun = config.schedule_times.includes(israelTime);
      console.log(`${shouldRun ? '✅' : '⏭️'} ${config.name}: scheduled for [${config.schedule_times.join(', ')}] | now: ${israelTime}`);
      return shouldRun;
    });

    if (!configs.length) {
      return new Response(JSON.stringify({ success: true, message: `No configs scheduled for ${israelTime}`, triggered: 0, currentTime: israelTime }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 Running ${configs.length} configs (Jina) scheduled for ${israelTime}`);

    const triggered: string[] = [];
    const errors: string[] = [];

    for (const config of configs) {
      try {
        console.log(`🔄 Triggering Jina scan for: ${config.name} (${config.id})`);
        // Call trigger-scout-pages-jina instead of trigger-scout-pages
        fetch(`${supabaseUrl}/functions/v1/trigger-scout-pages-jina`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ config_id: config.id }),
        }).catch(err => console.error(`❌ Failed to trigger ${config.name}:`, err));

        triggered.push(config.name);
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (err) {
        console.error(`❌ Error triggering ${config.name}:`, err);
        errors.push(`${config.name}: ${err.message}`);
      }
    }

    console.log(`✅ Triggered ${triggered.length} Jina scans:`, triggered);

    return new Response(JSON.stringify({
      success: true, triggered: triggered.length, configs: triggered,
      errors: errors.length > 0 ? errors : undefined,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('❌ Trigger Scout All Jina failed:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
