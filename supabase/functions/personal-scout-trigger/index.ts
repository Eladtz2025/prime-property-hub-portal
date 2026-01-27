import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Personal Scout Trigger
 * 
 * Triggers personalized property scans for each eligible lead.
 * COMPLETELY SEPARATE from trigger-scout-pages.
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🎯 Personal Scout Trigger started');

    // Parse request body for optional filters
    let body: { lead_id?: string; source?: string } = {};
    try {
      body = await req.json();
    } catch {
      // No body is fine
    }

    // 1. Get eligible leads
    let query = supabase
      .from('contact_leads')
      .select('*')
      .eq('matching_status', 'eligible')
      .not('preferred_cities', 'is', null);

    // Optional: filter to specific lead
    if (body.lead_id) {
      query = query.eq('id', body.lead_id);
    }

    const { data: leads, error: leadsError } = await query;

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: leadsError.message 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Filter leads that have at least one city preference
    const eligibleLeads = (leads || []).filter(lead => 
      lead.preferred_cities && lead.preferred_cities.length > 0
    );

    if (eligibleLeads.length === 0) {
      console.log('⚠️ No eligible leads with city preferences found');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No eligible leads with city preferences found',
        leads_checked: leads?.length || 0
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`🎯 Found ${eligibleLeads.length} eligible leads with city preferences`);

    // 2. Create a personal scout run record
    const { data: runRecord, error: runError } = await supabase
      .from('personal_scout_runs')
      .insert({
        status: 'running',
        leads_count: eligibleLeads.length,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (runError) {
      console.error('Error creating run record:', runError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: runError.message 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const runId = runRecord.id;
    console.log(`📝 Created run record: ${runId}`);

    // 3. Trigger worker for each lead with delays
    // 15 seconds between leads to prevent concurrency overload
    // 35 leads × 15s = 525s = ~9 minutes total
    const DELAY_BETWEEN_LEADS_MS = 15000;
    const sources = body.source ? [body.source] : ['yad2', 'madlan', 'homeless'];
    
    let triggeredCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < eligibleLeads.length; i++) {
      const lead = eligibleLeads[i];
      
      // Wait before triggering (except first)
      if (i > 0) {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_LEADS_MS));
      }

      const leadName = lead.name || lead.id.substring(0, 8);
      console.log(`📄 [${i + 1}/${eligibleLeads.length}] Triggering for lead: ${leadName}`);
      console.log(`   Cities: ${lead.preferred_cities?.join(', ')}`);
      console.log(`   Budget: ${lead.budget_min || 'N/A'}-${lead.budget_max || 'N/A'}`);
      console.log(`   Rooms: ${lead.rooms_min || 'N/A'}-${lead.rooms_max || 'N/A'}`);

      try {
        // Fire and forget - don't wait for completion
        fetch(`${supabaseUrl}/functions/v1/personal-scout-worker`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            lead_id: lead.id,
            run_id: runId,
            sources
          })
        }).catch(err => {
          console.error(`Background call failed for lead ${leadName}:`, err);
        });

        triggeredCount++;
      } catch (err) {
        const errorMsg = `Error triggering lead ${leadName}: ${err}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Personal Scout Trigger completed in ${duration}s`);
    console.log(`   Triggered: ${triggeredCount}/${eligibleLeads.length} leads`);

    return new Response(JSON.stringify({
      success: true,
      run_id: runId,
      leads_triggered: triggeredCount,
      leads_total: eligibleLeads.length,
      sources,
      duration_seconds: parseFloat(duration),
      errors: errors.length > 0 ? errors : undefined
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Personal Scout Trigger error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
