import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Personal Scout Trigger
 * 
 * Triggers personalized property scans for each eligible lead.
 * SEQUENTIAL execution - waits for each worker to complete before starting next.
 * This prevents overload and ensures all leads are processed.
 */

// Worker timeout - if worker doesn't respond in 3 minutes, consider it failed
const WORKER_TIMEOUT_MS = 180000;
// Delay between leads to prevent rate limiting
const DELAY_BETWEEN_LEADS_MS = 2000;
// Max retries per worker
const MAX_RETRIES = 2;

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

    // 3. Process each lead SEQUENTIALLY with await
    const sources = body.source ? [body.source] : ['yad2', 'madlan', 'homeless'];
    
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const results: Array<{ lead: string; success: boolean; matches?: number; error?: string }> = [];

    for (let i = 0; i < eligibleLeads.length; i++) {
      const lead = eligibleLeads[i];
      const leadName = lead.name || lead.id.substring(0, 8);
      
      console.log(`\n📄 [${i + 1}/${eligibleLeads.length}] Processing: ${leadName}`);
      console.log(`   Cities: ${lead.preferred_cities?.join(', ')}`);
      console.log(`   Budget: ${lead.budget_min || 'N/A'}-${lead.budget_max || 'N/A'}`);
      console.log(`   Rooms: ${lead.rooms_min || 'N/A'}-${lead.rooms_max || 'N/A'}`);

      // Delay between leads (except first)
      if (i > 0) {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_LEADS_MS));
      }

      let success = false;
      let lastError = '';
      let matchesFound = 0;

      // Retry loop
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`   Attempt ${attempt}/${MAX_RETRIES}...`);
          
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), WORKER_TIMEOUT_MS);

          const response = await fetch(`${supabaseUrl}/functions/v1/personal-scout-worker`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              lead_id: lead.id,
              run_id: runId,
              sources
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const result = await response.json();
            matchesFound = result.matches_found || 0;
            console.log(`   ✅ Success: ${matchesFound} matches found`);
            success = true;
            break;
          } else {
            const errorText = await response.text();
            lastError = `HTTP ${response.status}: ${errorText}`;
            console.error(`   ❌ Failed: ${lastError}`);
          }

        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            lastError = 'Worker timeout (3 minutes)';
            console.error(`   ⏱️ Timeout on attempt ${attempt}`);
          } else {
            lastError = err instanceof Error ? err.message : String(err);
            console.error(`   ❌ Error on attempt ${attempt}:`, lastError);
          }
        }

        // Wait before retry
        if (attempt < MAX_RETRIES) {
          console.log(`   Waiting 5s before retry...`);
          await new Promise(r => setTimeout(r, 5000));
        }
      }

      if (success) {
        successCount++;
        results.push({ lead: leadName, success: true, matches: matchesFound });
      } else {
        failedCount++;
        errors.push(`${leadName}: ${lastError}`);
        results.push({ lead: leadName, success: false, error: lastError });
      }
    }

    // 4. Update run record with final status
    const finalStatus = failedCount === 0 ? 'completed' : 
                        successCount === 0 ? 'failed' : 'partial';
    
    await supabase
      .from('personal_scout_runs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        error_message: errors.length > 0 ? `${failedCount} leads failed` : null
      })
      .eq('id', runId);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Personal Scout Trigger completed in ${duration}s`);
    console.log(`   Success: ${successCount}/${eligibleLeads.length}`);
    console.log(`   Failed: ${failedCount}/${eligibleLeads.length}`);

    return new Response(JSON.stringify({
      success: true,
      run_id: runId,
      status: finalStatus,
      leads_processed: {
        success: successCount,
        failed: failedCount,
        total: eligibleLeads.length
      },
      sources,
      duration_seconds: parseFloat(duration),
      errors: errors.length > 0 ? errors : undefined,
      results
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
