import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PageStat {
  page: number;
  url: string;
  status: 'pending' | 'scraping' | 'completed' | 'failed' | 'blocked';
  found: number;
  new: number;
  duration_ms: number;
  error?: string;
  started_at?: string;
}

interface ScoutRun {
  id: string;
  config_id: string;
  source: string;
  status: string;
  started_at: string;
  page_stats: PageStat[] | null;
  properties_found: number | null;
  new_properties: number | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('='.repeat(60));
  console.log('🧹 CLEANUP STUCK RUNS - Starting');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  try {
    // Fetch timeout settings from scout_settings
    const { data: settings } = await supabase
      .from('scout_settings')
      .select('setting_key, setting_value')
      .eq('category', 'scraping')
      .in('setting_key', ['page_timeout_minutes', 'run_timeout_minutes']);

    const settingsMap = new Map(settings?.map(s => [s.setting_key, s.setting_value]) || []);
    const pageTimeoutMinutes = Number(settingsMap.get('page_timeout_minutes')) || 3;
    const runTimeoutMinutes = Number(settingsMap.get('run_timeout_minutes')) || 15;

    console.log(`⚙️ Settings: page_timeout=${pageTimeoutMinutes}min, run_timeout=${runTimeoutMinutes}min`);

    // Fetch all running scout runs
    const { data: runningRuns, error: runsError } = await supabase
      .from('scout_runs')
      .select('*')
      .eq('status', 'running');

    if (runsError) {
      console.error('❌ Error fetching runs:', runsError);
      throw runsError;
    }

    if (!runningRuns || runningRuns.length === 0) {
      console.log('✅ No running runs found - nothing to clean');
      return new Response(
        JSON.stringify({ success: true, message: 'No running runs', cleaned: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${runningRuns.length} running runs`);

    const now = Date.now();
    let pagesTimedOut = 0;
    let runsForceCompleted = 0;
    const cleanupDetails: any[] = [];

    for (const run of runningRuns as ScoutRun[]) {
      const runAgeMinutes = (now - new Date(run.started_at).getTime()) / 60000;
      const pageStats = run.page_stats || [];
      
      console.log(`\n🔍 Checking run ${run.id} (${run.source})`);
      console.log(`   Age: ${runAgeMinutes.toFixed(1)} min | Pages: ${pageStats.length}`);

      // QUICK CHECK: If all pages are done but run is still "running", close it immediately
      const allPagesDone = pageStats.length > 0 && pageStats.every(p => 
        ['completed', 'failed', 'blocked'].includes(p.status)
      );
      
      if (allPagesDone) {
        console.log(`   ✅ All ${pageStats.length} pages finished - closing run immediately`);
        const hasErrors = pageStats.some(p => p.status === 'failed' || p.status === 'blocked');
        const finalStatus = hasErrors ? 'partial' : 'completed';
        
        const { error: closeError } = await supabase
          .from('scout_runs')
          .update({
            status: finalStatus,
            completed_at: new Date().toISOString()
          })
          .eq('id', run.id);
        
        if (!closeError) {
          runsForceCompleted++;
          console.log(`   ✅ Run closed as '${finalStatus}'`);
          cleanupDetails.push({
            runId: run.id,
            source: run.source,
            action: 'auto_closed',
            reason: `All ${pageStats.length} pages completed`
          });
          
          // Update config status
          if (run.config_id) {
            await supabase
              .from('scout_configs')
              .update({
                last_run_at: new Date().toISOString(),
                last_run_status: finalStatus,
                last_run_results: {
                  properties_found: run.properties_found || 0,
                  new_properties: run.new_properties || 0
                }
              })
              .eq('id', run.config_id);
          }
        }
        continue; // Move to next run
      }

      let needsUpdate = false;
      const updatedPageStats = [...pageStats];

      // Check 1: Run-level timeout - force close if too old
      if (runAgeMinutes > runTimeoutMinutes) {
        console.log(`   ⏰ RUN TIMEOUT: ${runAgeMinutes.toFixed(1)} > ${runTimeoutMinutes} min`);
        
        // Mark any pending/scraping pages as failed
        for (let i = 0; i < updatedPageStats.length; i++) {
          if (updatedPageStats[i].status === 'pending' || updatedPageStats[i].status === 'scraping') {
            updatedPageStats[i] = {
              ...updatedPageStats[i],
              status: 'failed',
              error: `Run timeout after ${runTimeoutMinutes} minutes`
            };
            pagesTimedOut++;
            needsUpdate = true;
          }
        }

        // Force complete the run
        const { error: updateError } = await supabase
          .from('scout_runs')
          .update({
            status: 'partial',
            completed_at: new Date().toISOString(),
            page_stats: updatedPageStats
          })
          .eq('id', run.id);

        if (updateError) {
          console.error(`   ❌ Failed to force-complete run:`, updateError);
        } else {
          runsForceCompleted++;
          console.log(`   ✅ Run force-completed as 'partial'`);
          cleanupDetails.push({
            runId: run.id,
            source: run.source,
            action: 'force_completed',
            reason: `Run exceeded ${runTimeoutMinutes} minute timeout`
          });
        }

        // Update config status
        if (run.config_id) {
          await supabase
            .from('scout_configs')
            .update({
              last_run_at: new Date().toISOString(),
              last_run_status: 'partial',
              last_run_results: {
                properties_found: run.properties_found || 0,
                new_properties: run.new_properties || 0,
                timeout: true
              }
            })
            .eq('id', run.config_id);
        }

        continue; // Move to next run
      }

      // Check 2: Page-level timeout - mark individual stuck pages as failed
      for (let i = 0; i < updatedPageStats.length; i++) {
        const page = updatedPageStats[i];
        
        if (page.status === 'scraping') {
          // For scraping pages, check if started_at exists and is too old
          const pageStarted = page.started_at ? new Date(page.started_at).getTime() : new Date(run.started_at).getTime();
          const pageAgeMinutes = (now - pageStarted) / 60000;
          
          if (pageAgeMinutes > pageTimeoutMinutes) {
            console.log(`   ⏰ PAGE ${page.page} TIMEOUT: ${pageAgeMinutes.toFixed(1)} > ${pageTimeoutMinutes} min`);
            updatedPageStats[i] = {
              ...page,
              status: 'failed',
              error: `Page timeout after ${pageTimeoutMinutes} minutes (stuck in scraping)`
            };
            pagesTimedOut++;
            needsUpdate = true;
          }
        } else if (page.status === 'pending' && runAgeMinutes > 10) {
          // Orphan detection: pending pages after 10 minutes likely indicate trigger failure
          console.log(`   👻 PAGE ${page.page} ORPHANED: still pending after ${runAgeMinutes.toFixed(1)} min`);
          updatedPageStats[i] = {
            ...page,
            status: 'failed',
            error: `Orphan page: trigger never fired (pending after 10+ min)`
          };
          pagesTimedOut++;
          needsUpdate = true;
        }
      }

      // If we updated page stats, save them and check if run should finalize
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('scout_runs')
          .update({ page_stats: updatedPageStats })
          .eq('id', run.id);

        if (updateError) {
          console.error(`   ❌ Failed to update page_stats:`, updateError);
        } else {
          console.log(`   ✅ Updated page_stats with timeout failures`);
          cleanupDetails.push({
            runId: run.id,
            source: run.source,
            action: 'pages_timed_out',
            pagesAffected: pagesTimedOut
          });
        }

        // Check if all pages are now done → finalize run
        const completedCount = updatedPageStats.filter(p => 
          ['completed', 'failed', 'blocked'].includes(p.status)
        ).length;
        const maxPages = updatedPageStats.length;

        if (completedCount >= maxPages) {
          const hasErrors = updatedPageStats.some(p => p.status === 'failed' || p.status === 'blocked');
          const finalStatus = hasErrors ? 'partial' : 'completed';

          const { error: finalizeError } = await supabase
            .from('scout_runs')
            .update({
              status: finalStatus,
              completed_at: new Date().toISOString()
            })
            .eq('id', run.id);

          if (!finalizeError) {
            runsForceCompleted++;
            console.log(`   ✅ Run finalized as '${finalStatus}'`);

            // Update config
            if (run.config_id) {
              await supabase
                .from('scout_configs')
                .update({
                  last_run_at: new Date().toISOString(),
                  last_run_status: finalStatus,
                  last_run_results: {
                    properties_found: run.properties_found || 0,
                    new_properties: run.new_properties || 0
                  }
                })
                .eq('id', run.config_id);
            }
          }
        }
      }
    }

    // === CLEANUP STUCK BACKFILL TASKS ===
    console.log('\n🔄 Checking for stuck backfill tasks...');
    let backfillsCleaned = 0;

    const { data: stuckBackfills, error: backfillError } = await supabase
      .from('backfill_progress')
      .select('*')
      .eq('status', 'running');

    if (backfillError) {
      console.error('❌ Error fetching backfill progress:', backfillError);
    } else if (stuckBackfills && stuckBackfills.length > 0) {
      for (const backfill of stuckBackfills) {
        const backfillUpdatedAt = backfill.updated_at || backfill.started_at || backfill.created_at;
        const ageMinutes = (now - new Date(backfillUpdatedAt).getTime()) / 60000;
        
        console.log(`   🔍 Backfill ${backfill.id} (${backfill.task_name}): ${ageMinutes.toFixed(1)} min old`);
        
        // If backfill is stuck for more than 5 minutes, mark as failed
        if (ageMinutes > 5) {
          console.log(`   ⏰ BACKFILL STUCK: ${backfill.id} - marking as failed`);
          
          const { error: updateError } = await supabase
            .from('backfill_progress')
            .update({
              status: 'failed',
              error_message: `Cleanup: stuck for ${ageMinutes.toFixed(0)} minutes`,
              completed_at: new Date().toISOString()
            })
            .eq('id', backfill.id);
          
          if (!updateError) {
            backfillsCleaned++;
            console.log(`   ✅ Backfill marked as failed`);
            cleanupDetails.push({
              type: 'backfill',
              id: backfill.id,
              taskName: backfill.task_name,
              action: 'marked_failed',
              ageMinutes: ageMinutes.toFixed(1)
            });
          } else {
            console.error(`   ❌ Failed to update backfill:`, updateError);
          }
        }
      }
    } else {
      console.log('✅ No stuck backfill tasks found');
    }

    // === CLEANUP STUCK PERSONAL SCOUT RUNS ===
    console.log('\n🎯 Checking for stuck personal scout runs...');
    let personalScoutsCleaned = 0;

    const { data: stuckPersonalRuns, error: personalRunsError } = await supabase
      .from('personal_scout_runs')
      .select('*')
      .eq('status', 'running');

    if (personalRunsError) {
      console.error('❌ Error fetching personal scout runs:', personalRunsError);
    } else if (stuckPersonalRuns && stuckPersonalRuns.length > 0) {
      for (const run of stuckPersonalRuns) {
        const runStarted = run.started_at || run.created_at;
        const ageMinutes = (now - new Date(runStarted).getTime()) / 60000;
        
        console.log(`   🔍 Personal Scout Run ${run.id}: ${ageMinutes.toFixed(1)} min old`);
        
        // If run is stuck for more than 30 minutes, mark as completed
        if (ageMinutes > 30) {
          console.log(`   ⏰ PERSONAL SCOUT STUCK: ${run.id} - completing`);
          
          // Get actual match counts
          const { count: matchCount } = await supabase
            .from('personal_scout_matches')
            .select('*', { count: 'exact', head: true })
            .eq('run_id', run.id);
          
          const { data: leadCounts } = await supabase
            .from('personal_scout_matches')
            .select('lead_id')
            .eq('run_id', run.id);
          
          const uniqueLeads = new Set(leadCounts?.map(m => m.lead_id) || []).size;
          
          const { error: updateError } = await supabase
            .from('personal_scout_runs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              leads_completed: uniqueLeads,
              total_matches: matchCount || 0
            })
            .eq('id', run.id);
          
          if (!updateError) {
            personalScoutsCleaned++;
            console.log(`   ✅ Personal scout run marked as completed (${uniqueLeads} leads, ${matchCount} matches)`);
            cleanupDetails.push({
              type: 'personal_scout',
              id: run.id,
              action: 'marked_completed',
              leadsCompleted: uniqueLeads,
              totalMatches: matchCount,
              ageMinutes: ageMinutes.toFixed(1)
            });
          } else {
            console.error(`   ❌ Failed to update personal scout run:`, updateError);
          }
        }
      }
    } else {
      console.log('✅ No stuck personal scout runs found');
    }

    // === CLEANUP STUCK AVAILABILITY CHECK RUNS ===
    console.log('\n🔍 Checking for stuck availability check runs...');
    let availabilityCleaned = 0;

    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000).toISOString();
    const { data: stuckAvailability, error: availabilityError } = await supabase
      .from('availability_check_runs')
      .select('*')
      .eq('status', 'running')
      .lt('started_at', fifteenMinutesAgo);

    if (availabilityError) {
      console.error('❌ Error fetching availability runs:', availabilityError);
    } else if (stuckAvailability && stuckAvailability.length > 0) {
      for (const run of stuckAvailability) {
        const ageMinutes = (now - new Date(run.started_at).getTime()) / 60000;
        console.log(`   ⏰ AVAILABILITY RUN STUCK: ${run.id} - ${ageMinutes.toFixed(1)} min old`);
        
        const { error: updateError } = await supabase
          .from('availability_check_runs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: `Cleanup: stuck for ${ageMinutes.toFixed(0)} minutes`
          })
          .eq('id', run.id);
        
        if (!updateError) {
          availabilityCleaned++;
          console.log(`   ✅ Availability run marked as failed`);
          cleanupDetails.push({
            type: 'availability_check',
            id: run.id,
            action: 'marked_failed',
            ageMinutes: ageMinutes.toFixed(1)
          });
        }
      }
    } else {
      console.log('✅ No stuck availability check runs found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🧹 CLEANUP COMPLETE');
    console.log(`   Pages timed out: ${pagesTimedOut}`);
    console.log(`   Runs force-completed: ${runsForceCompleted}`);
    console.log(`   Backfills cleaned: ${backfillsCleaned}`);
    console.log(`   Personal scouts cleaned: ${personalScoutsCleaned}`);
    console.log(`   Availability runs cleaned: ${availabilityCleaned}`);
    console.log('='.repeat(60));

    return new Response(
      JSON.stringify({
        success: true,
        pagesTimedOut,
        runsForceCompleted,
        backfillsCleaned,
        personalScoutsCleaned,
        availabilityCleaned,
        details: cleanupDetails,
        settings: { pageTimeoutMinutes, runTimeoutMinutes }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
