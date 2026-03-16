import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { detectBrokerFromMarkdown } from '../_shared/broker-detection.ts';
import { fetchCategorySettings, isPastEndTime } from '../_shared/settings.ts';
import { isProcessEnabled } from '../_shared/process-flags.ts';
import { getNeighborhoodConfig } from '../_shared/locations.ts';
import { normalizeNeighborhoodToValue } from '../_experimental/street-lookup.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// Blacklist Locations (Non-Tel Aviv)
// ============================================

const BLACKLIST_LOCATIONS: Array<{ pattern: RegExp; real_city: string }> = [
  { pattern: /נווה\s*כפיר/i, real_city: 'פתח תקווה' },
  { pattern: /צופים/i, real_city: 'צופים (מזרח השומרון)' },
  { pattern: /קיסריה/i, real_city: 'קיסריה' },
  { pattern: /מעלה\s*אדומים/i, real_city: 'מעלה אדומים' },
  { pattern: /צמח\s*השדה/i, real_city: 'מעלה אדומים' },
  { pattern: /סמדר\s*עילית/i, real_city: 'יבנאל' },
  { pattern: /רמות\s*נפתלי/i, real_city: 'רמות נפתלי' },
  { pattern: /קיבוץ\s*מחניים/i, real_city: 'קיבוץ מחניים' },
  { pattern: /מושב\s*כפר\s*דניאל/i, real_city: 'כפר דניאל' },
  { pattern: /,\s*אבן\s*יהודה$/i, real_city: 'אבן יהודה' },
  { pattern: /אבן\s*יהודה,\s*אבן\s*יהודה/i, real_city: 'אבן יהודה' },
  { pattern: /netanya/i, real_city: 'נתניה' },
  { pattern: /קרית\s*נורדאו/i, real_city: 'נתניה' },
  { pattern: /rishon\s*le?\s*zion/i, real_city: 'ראשון לציון' },
  { pattern: /herzliya(?!\s*pituach)/i, real_city: 'הרצליה' },
  { pattern: /ramat\s*gan/i, real_city: 'רמת גן' },
  { pattern: /givatayim/i, real_city: 'גבעתיים' },
  { pattern: /petah\s*tikva|petach\s*tikva/i, real_city: 'פתח תקווה' },
  { pattern: /holon/i, real_city: 'חולון' },
  { pattern: /bat\s*yam/i, real_city: 'בת ים' },
  { pattern: /קרית\s*מלאכי/i, real_city: 'קרית מלאכי' },
  { pattern: /קרית\s*גת/i, real_city: 'קרית גת' },
  { pattern: /קרית\s*אונו/i, real_city: 'קרית אונו' },
  { pattern: /קרית\s*ביאליק/i, real_city: 'קרית ביאליק' },
  { pattern: /קרית\s*מוצקין/i, real_city: 'קרית מוצקין' },
  { pattern: /קרית\s*ים/i, real_city: 'קרית ים' },
  { pattern: /קרית\s*אתא/i, real_city: 'קרית אתא' },
  { pattern: /קרית\s*שמונה/i, real_city: 'קרית שמונה' },
  { pattern: /יבנאל,\s*יבנאל/i, real_city: 'יבנאל' },
  { pattern: /,\s*יבנאל$/i, real_city: 'יבנאל' },
];

function isBlacklistedLocation(text: string): { blacklisted: boolean; real_city?: string } {
  if (!text) return { blacklisted: false };
  for (const { pattern, real_city } of BLACKLIST_LOCATIONS) {
    if (pattern.test(text)) {
      return { blacklisted: true, real_city };
    }
  }
  return { blacklisted: false };
}

interface PropertyData {
  rooms?: number;
  price?: number;
  size?: number;
  city?: string;
  floor?: number;
  neighborhood?: string;
}

interface PropertyFeatures {
  balcony?: boolean;
  yard?: boolean;
  elevator?: boolean;
  parking?: boolean;
  mamad?: boolean;
  storage?: boolean;
  roof?: boolean;
  aircon?: boolean;
  renovated?: boolean;
  furnished?: boolean;
  accessible?: boolean;
  pets?: boolean;
}

const BATCH_SIZE = 5;
const TASK_NAME = 'data_completion_jina';

function hasHouseNumber(address: string | null): boolean {
  if (!address) return false;
  return /\d{1,3}/.test(address);
}

const INVALID_ADDRESS_UPDATE_PATTERNS = [
  /נדל"?ן/i, /רימקס|re\/?max/i, /אנגלו\s*סכסון/i, /century\s*21/i,
  /קולדוול/i, /הומלנד/i, /Properties/i, /HomeMe/i, /Premium/i,
  /משרד\s*תיווך/i, /סוכנות/i, /Relocation/i, /REAL\s*ESTATE/i,
  /FRANCHI/i, /בית\s*ממכר/i, /ניהול\s*נכסים/i,
];

function isValidAddressForUpdate(address: string): boolean {
  if (!address || address.length < 3) return false;
  if (INVALID_ADDRESS_UPDATE_PATTERNS.some(p => p.test(address))) return false;
  if (!/[\u0590-\u05FF]/.test(address)) return false;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      action = 'start', 
      task_id, 
      dry_run = false,
      source_filter,
      only_recent = false,
      batch_size,
      auto_trigger = false,
      force_broker_reset = false
    } = await req.json().catch(() => ({}));

    // Fire-and-forget cleanup of stuck runs (only on start)
    if (action === 'start') {
      if (!await isProcessEnabled(supabase, 'backfill_jina')) {
        return new Response(JSON.stringify({ skipped: true, reason: 'Process disabled via kill switch' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      fetch(`${supabaseUrl}/functions/v1/cleanup-stuck-runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }).catch(err => console.error('⚠️ Cleanup-stuck-runs failed:', err));
    }

    // Handle stop action
    if (action === 'stop' && task_id) {
      console.log(`🛑 Stopping task ${task_id}`);
      await supabase
        .from('backfill_progress')
        .update({ 
          status: 'stopped',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', task_id);
      
      return new Response(JSON.stringify({ success: true, message: 'Task stopped' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle status check
    if (action === 'status') {
      const { data: progress } = await supabase
        .from('backfill_progress')
        .select('*, summary_data')
        .eq('task_name', TASK_NAME)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      return new Response(JSON.stringify({ success: true, progress, summary: progress?.summary_data || {} }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if there's already a running task
    const { data: existingTask } = await supabase
      .from('backfill_progress')
      .select('*')
      .eq('task_name', TASK_NAME)
      .eq('status', 'running')
      .single();

    let progressId: string;

    if (action === 'continue' && task_id) {
      if (!await isProcessEnabled(supabase, 'backfill_jina')) {
        console.log('🚫 Process backfill_jina is DISABLED — stopping self-chain');
        await supabase
          .from('backfill_progress')
          .update({ status: 'stopped', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', task_id);
        return new Response(JSON.stringify({ skipped: true, reason: 'Process disabled via kill switch' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      progressId = task_id;
      const { data: taskData } = await supabase
        .from('backfill_progress')
        .select('status')
        .eq('id', task_id)
        .single();
      
      if (taskData?.status === 'stopped' || taskData?.status === 'completed') {
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Task was stopped or completed',
          status: taskData.status
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else if (existingTask && action === 'start') {
      const taskAge = Date.now() - new Date(existingTask.updated_at).getTime();
      const isStuck = taskAge > 10 * 60 * 1000;
      
      if (isStuck) {
        console.log(`⚠️ Task ${existingTask.id} was stuck for ${Math.round(taskAge / 60000)} minutes, auto-stopping`);
        await supabase
          .from('backfill_progress')
          .update({
            status: 'stopped',
            error_message: 'Task was stuck for 10+ minutes, auto-stopped',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingTask.id);
      } else if (!auto_trigger) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Task already running',
          task_id: existingTask.id,
          progress: existingTask
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (!progressId!) {
      let countQuery = supabase
        .from('scouted_properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('source_url', 'is', null)
        .neq('source_url', 'https://www.homeless.co.il')
      .or('backfill_status.is.null,backfill_status.eq.pending,backfill_status.eq.failed');

      if (source_filter) {
        countQuery = countQuery.eq('source', source_filter);
      }

      if (only_recent) {
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        countQuery = countQuery.gte('created_at', thirtyMinAgo);
      }

      const { count: totalCount } = await countQuery;

      const taskName = auto_trigger ? `${TASK_NAME}_auto_${source_filter || 'all'}` : TASK_NAME;

      const { error: deleteError } = await supabase
        .from('backfill_progress')
        .delete()
        .eq('task_name', taskName)
        .in('status', ['completed', 'stopped', 'failed']);
      
      if (deleteError) {
        console.warn('⚠️ Failed to clean old backfill records:', deleteError.message);
      } else {
        console.log(`🧹 Cleaned old records for task_name: ${taskName}`);
      }

      const { data: newTask, error: insertError } = await supabase
        .from('backfill_progress')
        .insert({
          task_name: taskName,
          status: 'running',
          total_items: totalCount || 0,
          processed_items: 0,
          successful_items: 0,
          failed_items: 0,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;
      progressId = newTask.id;
      
      const triggerType = auto_trigger ? '🤖 Auto-backfill (Jina)' : '🚀 Manual backfill (Jina)';
      const filterInfo = source_filter ? ` for ${source_filter}` : '';
      const recentInfo = only_recent ? ' (recent only)' : '';
      console.log(`${triggerType} task started${filterInfo}${recentInfo}: ${progressId}, total items: ${totalCount}`);
    }

    const effectiveBatchSize = batch_size || BATCH_SIZE;

    let query = supabase
      .from('scouted_properties')
      .select('id, source_url, source, rooms, price, size, city, floor, neighborhood, address, title, features, is_private')
      .eq('is_active', true)
      .not('source_url', 'is', null)
      .neq('source_url', 'https://www.homeless.co.il')
      .or('backfill_status.is.null,backfill_status.eq.pending,backfill_status.eq.failed')
      .order('id', { ascending: true })
      .limit(effectiveBatchSize);

    if (source_filter) {
      query = query.eq('source', source_filter);
    }

    if (only_recent) {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      query = query.gte('created_at', thirtyMinAgo);
    }

    const { data: properties, error } = await query;

    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }

    console.log(`📋 Batch (Jina): Found ${properties?.length || 0} properties to process`);

    if (properties.length === 0) {
      await supabase
        .from('backfill_progress')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', progressId);

      console.log('✅ Backfill (Jina) completed - no more items to process');
      
      return new Response(JSON.stringify({
        success: true,
        status: 'completed',
        message: 'All items processed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let successCount = 0;
    let failCount = 0;

    async function saveRecentItem(item: {
      address?: string;
      neighborhood?: string;
      source?: string;
      source_url?: string;
      status: string;
      fields_found?: string[];
      fields_updated?: string[];
      broker_result?: string | null;
      address_action?: string | null;
      timestamp: string;
    }) {
      try {
        const { data: current } = await supabase
          .from('backfill_progress')
          .select('summary_data')
          .eq('id', progressId)
          .single();
        
        const summary = (current?.summary_data as Record<string, any>) || {};
        const recentItems = Array.isArray(summary.recent_items) ? summary.recent_items : [];
        recentItems.push(item);
        if (recentItems.length > 500) recentItems.splice(0, recentItems.length - 500);
        summary.recent_items = recentItems;
        
        await supabase
          .from('backfill_progress')
          .update({ summary_data: summary, updated_at: new Date().toISOString() })
          .eq('id', progressId);
      } catch (e) {
        console.error('Failed to save recent_item:', e);
      }
    }

    const batchStats = {
      total_processed: 0,
      address_attempted_upgrade: 0,
      address_upgraded: 0,
      address_no_number_in_source: 0,
      address_street_mismatch: 0,
      address_validation_failed: 0,
      address_already_has_number: 0,
      address_set_from_scratch: 0,
      address_no_address: 0,
      features_updated: 0,
      broker_classified: 0,
      broker_reset_to_unknown: 0,
      fields_updated: { rooms: 0, price: 0, size: 0, city: 0, floor: 0, neighborhood: 0 },
      blacklisted: 0,
      non_ta_deactivated: 0,
      scrape_failed: 0,
      timeout_skipped: 0,
      no_content: 0,
      no_new_data: 0,
      update_db_error: 0,
    };

    for (const prop of properties) {
      try {
        // Check if task was stopped
        const { data: taskStatus } = await supabase
          .from('backfill_progress')
          .select('status')
          .eq('id', progressId)
          .single();
        
        if (taskStatus?.status === 'stopped') {
          console.log('🛑 Task was stopped, exiting batch');
          break;
        }

        if (!prop.source_url || !prop.source_url.includes('http')) {
          failCount++;
          batchStats.total_processed++;
          await supabase.from('scouted_properties').update({ backfill_status: 'failed' }).eq('id', prop.id);
          continue;
        }

        console.log(`\n🔍 Processing (Jina): ${prop.source_url}`);

        // ===== JINA SCRAPE with 45s property-level timeout =====
        const propertyController = new AbortController();
        const propertyTimeout = setTimeout(() => propertyController.abort(), 45000);
        
        // All sources: same headers (no Madlan-specific logic)
        const jinaHeaders: Record<string, string> = {
          'Accept': 'text/markdown',
          'X-Wait-For-Selector': 'body',
          'X-Timeout': '35',
          'X-Locale': 'he-IL',
          'X-No-Cache': 'true',
          'X-Proxy-Country': 'IL',
        };

        let scrapeResponse: Response;
        try {
          scrapeResponse = await fetch(`https://r.jina.ai/${prop.source_url}`, {
            method: 'GET',
            headers: jinaHeaders,
            signal: propertyController.signal,
          });
        } catch (fetchError) {
          clearTimeout(propertyTimeout);
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            console.log(`⏱️ Property timeout (45s) for ${prop.source_url} — skipping`);
            failCount++;
            batchStats.timeout_skipped++;
            batchStats.total_processed++;
            await supabase.from('scouted_properties').update({ backfill_status: 'failed' }).eq('id', prop.id);
            await saveRecentItem({
              address: prop.address || prop.title,
              neighborhood: prop.neighborhood,
              source: prop.source,
              source_url: prop.source_url,
              status: 'timeout_skipped',
              timestamp: new Date().toISOString(),
            });
            // Update progress in DB
            const { data: currentProgress } = await supabase
              .from('backfill_progress')
              .select('processed_items, failed_items')
              .eq('id', progressId)
              .single();
            await supabase.from('backfill_progress').update({
              processed_items: (currentProgress?.processed_items || 0) + 1,
              failed_items: (currentProgress?.failed_items || 0) + 1,
              updated_at: new Date().toISOString(),
            }).eq('id', progressId);
            continue;
          }
          throw fetchError;
        }
        clearTimeout(propertyTimeout);

        if (!scrapeResponse.ok) {
          const errorText = await scrapeResponse.text();
          console.log(`❌ Jina scrape failed (${scrapeResponse.status}): ${errorText.substring(0, 200)}`);
          failCount++;
          batchStats.scrape_failed++;
          batchStats.total_processed++;
          await supabase.from('scouted_properties').update({ backfill_status: 'failed' }).eq('id', prop.id);
          await saveRecentItem({
            address: prop.address || prop.title,
            neighborhood: prop.neighborhood,
            source: prop.source,
            source_url: prop.source_url,
            status: 'scrape_failed',
            timestamp: new Date().toISOString(),
          });
          continue;
        }

        const markdown = await scrapeResponse.text();


        if (!markdown || markdown.length < 100) {
          console.log(`❌ No content scraped (Jina)`);
          failCount++;
          batchStats.no_content++;
          batchStats.total_processed++;
          await supabase.from('scouted_properties').update({ backfill_status: 'failed' }).eq('id', prop.id);
          await saveRecentItem({
            address: prop.address || prop.title,
            neighborhood: prop.neighborhood,
            source: prop.source,
            source_url: prop.source_url,
            status: 'no_content',
            timestamp: new Date().toISOString(),
          });
          continue;
        }

        // Extract data (same logic as Firecrawl version)
        const extracted = extractPropertyData(markdown, prop.source);
        const features = extractFeatures(markdown, prop.source);
        
        console.log(`📊 Extracted data:`, JSON.stringify(extracted));
        console.log(`🏷️ Extracted features:`, JSON.stringify(features));

        // Blacklist check
        const existingText = `${prop.title || ''} ${prop.address || ''}`;
        const blacklistCheck = isBlacklistedLocation(existingText);
        if (blacklistCheck.blacklisted) {
          console.log(`🗑️ Property ${prop.id} blacklisted (${blacklistCheck.real_city}), marking inactive`);
          await supabase
            .from('scouted_properties')
            .update({ 
              is_active: false,
              status: 'inactive',
              backfill_status: 'not_needed',
              availability_checked_at: new Date().toISOString(),
              availability_check_reason: `blacklisted_location_${blacklistCheck.real_city}`
            })
            .eq('id', prop.id);
          
          successCount++;
          batchStats.blacklisted++;
          batchStats.total_processed++;
          await saveRecentItem({
            address: prop.address || prop.title,
            neighborhood: prop.neighborhood,
            source: prop.source,
            source_url: prop.source_url,
            status: 'blacklisted',
            timestamp: new Date().toISOString(),
          });
          continue;
        }
        
        // Non-TA check
        const finalCity = extracted.city || prop.city || '';
        if (finalCity.length > 0) {
          const isTelAviv = finalCity.includes('תל אביב') || finalCity.includes('תל-אביב');
          
          if (!isTelAviv) {
            console.log(`🗑️ Property ${prop.id} is in ${finalCity}, marking as inactive`);
            await supabase
              .from('scouted_properties')
              .update({ 
                is_active: false,
                status: 'inactive',
                backfill_status: 'not_needed',
                availability_checked_at: new Date().toISOString(),
                availability_check_reason: `non_ta_city_${finalCity}`
              })
              .eq('id', prop.id);
            
            successCount++;
            batchStats.non_ta_deactivated++;
            batchStats.total_processed++;
            await saveRecentItem({
              address: prop.address || prop.title,
              neighborhood: prop.neighborhood,
              source: prop.source,
              source_url: prop.source_url,
              status: 'blacklisted',
              timestamp: new Date().toISOString(),
            });
            continue;
          }
        }

        // Prepare updates
        const updates: Record<string, any> = {};
        
        if (!prop.rooms && extracted.rooms) { updates.rooms = extracted.rooms; batchStats.fields_updated.rooms++; }
        if (!prop.price && extracted.price) { updates.price = extracted.price; batchStats.fields_updated.price++; }
        if (!prop.size && extracted.size) { updates.size = extracted.size; batchStats.fields_updated.size++; }
        if (!prop.city && extracted.city) { updates.city = extracted.city; batchStats.fields_updated.city++; }
        if (!prop.floor && extracted.floor !== undefined) { updates.floor = extracted.floor; batchStats.fields_updated.floor++; }
        if (!prop.neighborhood && extracted.neighborhood) { updates.neighborhood = extracted.neighborhood; batchStats.fields_updated.neighborhood++; }
        
        // Address enrichment
        if (prop.address && !hasHouseNumber(prop.address)) {
          batchStats.address_attempted_upgrade++;
          const pageAddress = extractAddressFromPage(markdown, prop.source);
          if (pageAddress && pageAddress.houseNumber >= 1 && pageAddress.houseNumber <= 999) {
            if (!isValidAddressForUpdate(pageAddress.fullAddress)) {
              batchStats.address_validation_failed++;
            } else {
              const existingNorm = prop.address.replace(/[\s'".\-\/]+/g, ' ').trim();
              const newStreetNorm = pageAddress.street.replace(/[\s'".\-\/]+/g, ' ').trim();
              if (newStreetNorm.includes(existingNorm) || existingNorm.includes(newStreetNorm)) {
                updates.address = pageAddress.fullAddress;
                updates.duplicate_check_possible = true;
                batchStats.address_upgraded++;
                console.log(`📍 Address upgraded: "${prop.address}" → "${pageAddress.fullAddress}"`);
              } else {
                batchStats.address_street_mismatch++;
              }
            }
          } else {
            batchStats.address_no_number_in_source++;
          }
        } else if (!prop.address) {
          const pageAddress = extractAddressFromPage(markdown, prop.source);
          if (pageAddress) {
            updates.address = pageAddress.fullAddress;
            batchStats.address_set_from_scratch++;
          } else {
            batchStats.address_no_address++;
          }
        } else {
          batchStats.address_already_has_number++;
        }
        
        // Entry date
        const entryDateInfo = extractEntryDateInfo(markdown, prop.source);
        
        // Features merge
        const existingFeatures = (prop.features || {}) as Record<string, any>;
        const existingIsEmpty = !prop.features || Object.keys(prop.features).length === 0;
        const hasNewFeatures = Object.keys(features).some(key => features[key as keyof PropertyFeatures] === true);
        
        const mergedFeatures = { ...existingFeatures, ...features };
        
        if (entryDateInfo.entry_date && !existingFeatures.entry_date) {
          mergedFeatures.entry_date = entryDateInfo.entry_date;
        }
        if (!existingFeatures.entry_date && !existingFeatures.immediate_entry) {
          mergedFeatures.immediate_entry = entryDateInfo.immediate_entry;
        }
        
        if (mergedFeatures.elevator !== true && !existingFeatures.elevator) {
          mergedFeatures.elevator = false;
        }
        
        if (hasNewFeatures || existingIsEmpty || entryDateInfo.entry_date || entryDateInfo.immediate_entry || mergedFeatures.elevator === false) {
          updates.features = mergedFeatures;
          batchStats.features_updated++;
        }

        // Broker detection
        const shouldClassifyBroker = prop.is_private === null || prop.is_private === undefined;

        if (shouldClassifyBroker) {
          const isPrivate = detectBrokerFromMarkdown(markdown, prop.source);
          if (isPrivate !== null) {
            updates.is_private = isPrivate;
            batchStats.broker_classified++;
            console.log(`🏷️ Classified as: ${isPrivate ? 'פרטי' : 'תיווך'}`);
          } else if (force_broker_reset && prop.source === 'madlan' && prop.is_private === false) {
            updates.is_private = null;
            batchStats.broker_reset_to_unknown++;
          }
        }

        if (Object.keys(updates).length === 0) {
          batchStats.no_new_data++;
          batchStats.total_processed++;
          await supabase.from('scouted_properties').update({ backfill_status: 'not_needed' }).eq('id', prop.id);
          await saveRecentItem({
            address: prop.address || prop.title,
            neighborhood: prop.neighborhood,
            source: prop.source,
            source_url: prop.source_url,
            status: 'no_new_data',
            fields_found: Object.keys(extracted).filter(k => (extracted as any)[k] != null),
            timestamp: new Date().toISOString(),
          });
          continue;
        }

        if (!dry_run) {
          updates.backfill_status = 'completed';
          const { error: updateError } = await supabase
            .from('scouted_properties')
            .update(updates)
            .eq('id', prop.id);

          if (updateError) {
            console.log(`❌ Update failed:`, updateError);
            failCount++;
            batchStats.update_db_error++;
            batchStats.total_processed++;
            await supabase.from('scouted_properties').update({ backfill_status: 'failed' }).eq('id', prop.id);
            await saveRecentItem({
              address: prop.address || prop.title,
              neighborhood: prop.neighborhood,
              source: prop.source,
              source_url: prop.source_url,
              status: 'update_error',
              timestamp: new Date().toISOString(),
            });
            continue;
          }
        }

        const fieldsFound = Object.keys(extracted).filter(k => (extracted as any)[k] != null);
        const fieldsUpdated = Object.keys(updates).filter(k => !['features', 'is_private', 'duplicate_check_possible'].includes(k));
        const brokerResult = updates.is_private !== undefined 
          ? (updates.is_private === true ? 'private' : updates.is_private === false ? 'broker' : null)
          : null;
        const addressAction = updates.address 
          ? (prop.address ? 'upgraded' : 'set_new')
          : null;

        console.log(`✅ Updated with (Jina):`, JSON.stringify(updates));
        successCount++;
        batchStats.total_processed++;

        await supabase
          .from('backfill_progress')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', progressId);

        await saveRecentItem({
          address: updates.address || prop.address || prop.title,
          neighborhood: updates.neighborhood || prop.neighborhood,
          source: prop.source,
          source_url: prop.source_url,
          status: 'ok',
          fields_found: fieldsFound,
          fields_updated: fieldsUpdated,
          broker_result: brokerResult,
          address_action: addressAction,
          timestamp: new Date().toISOString(),
        });

        // Delay between requests
        await new Promise(r => setTimeout(r, 1500));

      } catch (propError) {
        console.error(`Error processing ${prop.id}:`, propError);
        failCount++;
        batchStats.total_processed++;
        await supabase.from('scouted_properties').update({ backfill_status: 'failed' }).eq('id', prop.id);
      }
    }

    // Update progress
    const { data: currentProgress } = await supabase
      .from('backfill_progress')
      .select('processed_items, successful_items, failed_items, status, summary_data')
      .eq('id', progressId)
      .single();

    if (currentProgress?.status === 'stopped') {
      return new Response(JSON.stringify({
        success: true,
        status: 'stopped',
        message: 'Task was stopped'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Merge batch stats
    const existingSummary = (currentProgress?.summary_data as Record<string, any>) || {};
    const mergedSummary: Record<string, any> = {};
    const numericKeys = [
      'total_processed', 'address_attempted_upgrade', 'address_upgraded',
      'address_no_number_in_source', 'address_street_mismatch', 'address_validation_failed',
      'address_already_has_number', 'address_set_from_scratch', 'address_no_address',
      'features_updated', 'broker_classified', 'blacklisted', 'non_ta_deactivated',
      'scrape_failed', 'no_content', 'no_new_data', 'update_db_error'
    ];
    for (const key of numericKeys) {
      mergedSummary[key] = (existingSummary[key] || 0) + (batchStats[key as keyof typeof batchStats] as number || 0);
    }
    const existingFields = existingSummary.fields_updated || {};
    mergedSummary.fields_updated = {
      rooms: (existingFields.rooms || 0) + batchStats.fields_updated.rooms,
      price: (existingFields.price || 0) + batchStats.fields_updated.price,
      size: (existingFields.size || 0) + batchStats.fields_updated.size,
      city: (existingFields.city || 0) + batchStats.fields_updated.city,
      floor: (existingFields.floor || 0) + batchStats.fields_updated.floor,
      neighborhood: (existingFields.neighborhood || 0) + batchStats.fields_updated.neighborhood,
    };

    await supabase
      .from('backfill_progress')
      .update({
        processed_items: (currentProgress?.processed_items || 0) + properties.length,
        successful_items: (currentProgress?.successful_items || 0) + successCount,
        failed_items: (currentProgress?.failed_items || 0) + failCount,
        summary_data: mergedSummary,
        updated_at: new Date().toISOString()
      })
      .eq('id', progressId);

    console.log(`📊 Batch (Jina) Report:
  🏠 upgraded: ${batchStats.address_upgraded}
  🏷️ broker: ${batchStats.broker_classified}
  🏷️ features: ${batchStats.features_updated}
  📈 ${successCount} updated, ${failCount} failed`);

    // Check remaining + self-chain
    let remainingQuery = supabase
      .from('scouted_properties')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('source_url', 'is', null)
      .neq('source_url', 'https://www.homeless.co.il')
      .or('backfill_status.is.null,backfill_status.eq.pending,backfill_status.eq.failed');
    if (source_filter) {
      remainingQuery = remainingQuery.eq('source', source_filter);
    }
    const { count: remainingCount } = await remainingQuery;

    const hasMore = (remainingCount || 0) > 0;

    let endTimeReached = false;
    try {
      const backfillSettings = await fetchCategorySettings(supabase, 'backfill');
      endTimeReached = isPastEndTime(backfillSettings.schedule_end_time);
    } catch (e) {
      console.warn('Failed to check end time:', e);
    }

    if (hasMore && !endTimeReached) {
      console.log(`🔄 ${remainingCount} items remaining, triggering next batch (Jina)...`);
      
      const continueUrl = `${supabaseUrl}/functions/v1/backfill-property-data-jina`;
      try {
        const triggerResponse = await fetch(continueUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            action: 'continue', 
            task_id: progressId, 
            dry_run,
            source_filter,
            force_broker_reset
          })
        });
        
        if (!triggerResponse.ok) {
          console.error(`Failed to trigger next batch: ${triggerResponse.status}`);
        } else {
          console.log(`✅ Next batch triggered successfully (Jina)`);
        }
      } catch (err) {
        console.error('Failed to trigger next batch:', err);
      }
    } else {
      const stopReason = endTimeReached ? 'stopped' : 'completed';
      const stopMessage = endTimeReached ? `End time reached, ${remainingCount || 0} items remaining` : undefined;
      
      await supabase
        .from('backfill_progress')
        .update({ 
          status: stopReason,
          completed_at: new Date().toISOString(),
          summary_data: mergedSummary,
          updated_at: new Date().toISOString(),
          ...(stopMessage ? { error_message: stopMessage } : {})
        })
        .eq('id', progressId);
      
      console.log(`🏁 BACKFILL JINA ${stopReason.toUpperCase()}`);
    }

    return new Response(JSON.stringify({
      success: true,
      task_id: progressId,
      batch_processed: properties.length,
      batch_updated: successCount,
      batch_failed: failCount,
      has_more: hasMore,
      remaining: remainingCount || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Backfill Jina error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// All extraction functions (same as Firecrawl version)
// ============================================

function extractPropertyData(markdown: string, source: string): PropertyData {
  const data: PropertyData = {};

  const roomPatterns = [
    /(\d+\.?\d*)\s*חדר/i, /חדרים[:\s]+(\d+\.?\d*)/i,
    /rooms[:\s]+(\d+\.?\d*)/i, /(\d+\.?\d*)\s*rooms/i,
  ];
  for (const pattern of roomPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const rooms = parseFloat(match[1]);
      if (rooms >= 1 && rooms <= 15) { data.rooms = rooms; break; }
    }
  }

  const pricePatterns = [
    /₪\s*([\d,]+)/, /([\d,]+)\s*₪/, /מחיר[:\s]*([\d,]+)/,
    /price[:\s]*([\d,]+)/i, /([\d,]{4,})\s*ש"ח/, /([\d,]{4,})\s*שקל/,
  ];
  for (const pattern of pricePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const price = parseInt(match[1].replace(/,/g, ''));
      if (price >= 1000 && price <= 50000000) { data.price = price; break; }
    }
  }

  const mainContent = markdown.split(/עוד מודעות|מודעות דומות|עוד חיפושים|מודעות נוספות/i)[0] || markdown;
  const sizePatterns = [
    /מ"ר[:\s]*(\d+)/, /שטח[:\s]*(\d+)/, /(\d+)\s*מ"ר(?!\s*[•|])/i,
    /(\d+)\s*מטר\s*רבוע/i, /(\d+)\s*sqm/i, /(\d+)\s*sq\.?\s*m/i, /size[:\s]*(\d+)/i,
  ];
  for (const pattern of sizePatterns) {
    const match = mainContent.match(pattern);
    if (match) {
      const size = parseInt(match[1]);
      if (size >= 20 && size <= 1000) { data.size = size; break; }
    }
  }

  const floorPatterns = [/קומה[:\s]*(\d+)/, /floor[:\s]*(\d+)/i, /(\d+)\s*קומה/];
  for (const pattern of floorPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const floor = parseInt(match[1]);
      if (floor >= 0 && floor <= 50) { data.floor = floor; break; }
    }
  }

  const cities = [
    'תל אביב', 'תל-אביב', 'רמת גן', 'גבעתיים', 'הרצליה', 'רעננה', 
    'כפר סבא', 'פתח תקווה', 'ראשון לציון', 'חולון', 'בת ים',
    'נתניה', 'אשדוד', 'באר שבע', 'חיפה', 'ירושלים', 'בני ברק',
    'הוד השרון', 'רחובות', 'נס ציונה', 'אור יהודה', 'יהוד'
  ];
  for (const city of cities) {
    if (markdown.includes(city)) { data.city = city.replace('-', ' '); break; }
  }

  const neighborhoods = [
    'צפון ישן', 'צפון חדש', 'כיכר המדינה', 'לב העיר', 'מרכז העיר',
    'בבלי', 'נווה צדק', 'כרם התימנים', 'רמת אביב', 'פלורנטין',
    'צהלה', 'רוטשילד', 'נמל תל אביב', 'נחלת בנימין', 'שרונה',
    'לב תל אביב', 'יפו', 'עג\'מי', 'נוה שאנן'
  ];
  for (const neighborhood of neighborhoods) {
    if (markdown.includes(neighborhood)) { data.neighborhood = neighborhood; break; }
  }

  return data;
}

function extractAddressFromPage(
  markdown: string, source: string
): { street: string; houseNumber: number; fullAddress: string } | null {
  if (!markdown || markdown.length < 50) return null;
  if (source === 'yad2') return extractYad2PageAddress(markdown);
  if (source === 'madlan') return extractMadlanPageAddress(markdown);
  return null;
}

function extractYad2PageAddress(
  markdown: string
): { street: string; houseNumber: number; fullAddress: string } | null {
  const patterns = [
    /^#{1,3}\s*([\u0590-\u05FF][\u0590-\u05FF\s'".\-\/]*?)\s+(\d{1,3})\s*(?:[,\s]*(?:דירה|דירת|גג|פנטהאוז|סטודיו|בית))/m,
    /^#{1,3}\s*([\u0590-\u05FF][\u0590-\u05FF\s'".\-\/]*?)\s+(\d{1,3})\s*$/m,
    /\*\*([\u0590-\u05FF][\u0590-\u05FF\s'".\-\/]*?)\s+(\d{1,3})\*\*/,
    /כתובת[:\s]+([\u0590-\u05FF][\u0590-\u05FF\s'".\-\/]*?)\s+(\d{1,3})(?:\s|,|$)/,
  ];
  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match) {
      const street = match[1].trim();
      const houseNumber = parseInt(match[2], 10);
      if (houseNumber >= 1 && houseNumber <= 999 && street.length >= 2) {
        const fullAddress = `${street} ${houseNumber}`;
        if (isValidAddressForUpdate(fullAddress)) return { street, houseNumber, fullAddress };
      }
    }
  }
  return null;
}

function extractMadlanPageAddress(
  markdown: string
): { street: string; houseNumber: number; fullAddress: string } | null {
  const patterns = [
    /(?:דירה|דירת\s*גן|פנטהאוז|סטודיו|גג|קוטג'?|בית\s*פרטי)[^,]*,\s*([\u0590-\u05FF][\u0590-\u05FF\s'".\-\/]*?)\s+(\d{1,3})\s*(?:,|$)/m,
    /^#{1,3}\s*.*?([\u0590-\u05FF][\u0590-\u05FF\s'".\-\/]*?)\s+(\d{1,3})\s*(?:,|$)/m,
  ];
  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match) {
      const street = match[1].trim();
      const houseNumber = parseInt(match[2], 10);
      if (houseNumber >= 1 && houseNumber <= 999 && street.length >= 2) {
        const fullAddress = `${street} ${houseNumber}`;
        if (isValidAddressForUpdate(fullAddress)) return { street, houseNumber, fullAddress };
      }
    }
  }
  return null;
}

function extractFeatures(markdown: string, source?: string): PropertyFeatures {
  const features: PropertyFeatures = {};
  const text = isolatePropertyDescription(markdown, source);

  const hasFeature = (positivePatterns: RegExp[], negativePatterns: RegExp[] = []): boolean => {
    for (const neg of negativePatterns) { if (neg.test(text)) return false; }
    for (const pos of positivePatterns) { if (pos.test(text)) return true; }
    return false;
  };

  if (hasFeature(
    [/יש\s*מרפסת/i, /כולל\s*מרפסת/i, /עם\s*מרפסת/i, /מרפסת\s*(שמש|גדולה|מרווחת|יפה|קטנה|רחבה)/i, /\bמרפסת\b.*מ"ר/i, /\d+\s*מרפס[תו]ת/i, /מרפסות/i, /\bמרפסת\b/],
    [/אין\s*מרפסת/i, /ללא\s*מרפסת/i, /בלי\s*מרפסת/i]
  )) features.balcony = true;

  if (hasFeature(
    [/יש\s*(חצר|גינה)/i, /כולל\s*(חצר|גינה)/i, /עם\s*(חצר|גינה)/i, /\b(חצר|גינה)\s*(פרטית|גדולה|ירוקה|משותפת)/i, /גן\s*פרטי/i, /דירת\s*גן/i, /גינה\s*פרטית/i, /\bדשא\b/i, /\bפטיו\b/i, /\bחצר\b/],
    [/אין\s*(חצר|גינה)/i, /ללא\s*(חצר|גינה)/i, /בלי\s*(חצר|גינה)/i]
  )) features.yard = true;

  if (hasFeature(
    [/יש\s*מעלית/i, /כולל\s*מעלית/i, /עם\s*מעלית/i, /בניין\s*עם\s*מעלית/i, /מעלית\s*שבת/i, /\d+\s*מעליות/i, /[-•]\s*מעלית/, /מעלית/],
    [/אין\s*מעלית/i, /ללא\s*מעלית/i, /בלי\s*מעלית/i, /בלעדי\s*מעלית/i]
  )) features.elevator = true;

  if (hasFeature(
    [/יש\s*חניה/i, /כולל\s*חניה/i, /עם\s*חניה/i, /חניה\s*(פרטית|בטאבו|בבניין|בחניון|מקורה|תת\s*קרקעית)/i, /מקום\s*חניה/i, /חנייה/, /\d+\s*חניות/i, /חניון/i, /\bחניה\b/],
    [/אין\s*חניה/i, /ללא\s*חניה/i, /בלי\s*חניה/i]
  )) features.parking = true;

  if (hasFeature(
    [/יש\s*ממ"?ד/i, /כולל\s*ממ"?ד/i, /עם\s*ממ"?ד/i, /\bממ"ד\b/, /\bממד\b/, /מרחב\s*מוגן/i, /חדר\s*ביטחון/i, /ממ"?ד\s*צמוד/i, /ממ"?ד\s*קומתי/i],
    [/אין\s*ממ"?ד/i, /ללא\s*ממ"?ד/i, /בלי\s*ממ"?ד/i]
  )) features.mamad = true;

  if (hasFeature(
    [/יש\s*מחסן/i, /כולל\s*מחסן/i, /עם\s*מחסן/i, /\bמחסן\b\s*(פרטי|גדול|בבניין)/i, /מחסן\s*ו?חניה/i],
    [/אין\s*מחסן/i, /ללא\s*מחסן/i]
  )) features.storage = true;

  if (hasFeature(
    [/גג\s*(פרטי|צמוד|מרווח)/i, /גישה\s*לגג/i, /פנטהאו[זס]/i, /דירת\s*גג/i], []
  )) features.roof = true;

  if (hasFeature(
    [/יש\s*מזגנ?/i, /כולל\s*מזגנ?/i, /עם\s*מזגנ?/i, /מזגנים/i, /מיזוג\s*(אוויר|מרכזי)/i, /מיזוג\s*בכל/i],
    [/אין\s*מזגנ?/i, /ללא\s*מזגנ?/i]
  )) features.aircon = true;

  if (hasFeature(
    [/משופצ[תת]/i, /שיפוץ\s*(יסודי|מלא|חדש)/i, /לאחר\s*שיפוץ/i, /חדש\s*מהניילון/i, /שופץ\s*(לאחרונה|ב\d{4})/i], []
  )) features.renovated = true;

  if (hasFeature(
    [/מרוהט[תת]?\s*(במלואה|חלקית)?/i, /כולל\s*ריהוט/i, /עם\s*ריהוט/i, /ריהוט\s*(מלא|חלקי)/i],
    [/לא\s*מרוהט/i, /ללא\s*ריהוט/i, /ריק[הה]?\s*מריהוט/i]
  )) features.furnished = true;

  if (hasFeature(
    [/נגיש\s+לנכים/i, /מותאם\s+לנכים/i, /גישה\s+לכיסא\s+גלגלים/i, /נגישות\s+לנכים/i, /דירה\s+נגישה/i],
    [/נגישות\s*לאתר/i, /תנאי\s*נגישות/i, /הצהרת\s*נגישות/i]
  )) features.accessible = true;

  if (hasFeature(
    [/מותר\s*(חיות|בע"ח)/i, /חיות\s*מחמד\s*(מותר|אפשר)/i, /ידידותי\s*לחיות/i, /pet\s*friendly/i],
    [/אסור\s*חיות/i, /ללא\s*חיות/i, /לא\s*מותר\s*חיות/i]
  )) features.pets = true;

  return features;
}

function isolatePropertyDescription(markdown: string, source?: string): string {
  if (source === 'madlan') {
    let text = '';
    const advantagesMatch = markdown.match(/יתרונות הנכס([\s\S]*?)(?:##|תיאור הנכס|מפרט מלא|מידע נוסף|$)/i);
    if (advantagesMatch) text += advantagesMatch[1] + '\n';
    const descriptionMatch = markdown.match(/תיאור הנכס([\s\S]*?)(?:##|מפרט מלא|מידע נוסף|צור קשר|$)/i);
    if (descriptionMatch) text += descriptionMatch[1] + '\n';
    if (text.length > 50) return text;
    return markdown.replace(/##?\s*מפרט מלא[\s\S]*?(?=##|מידע נוסף|צור קשר|$)/gi, '');
  }

  if (markdown.length < 2000) return markdown;

  const descriptionMarkers = [/תיאור\s*(הנכס|הדירה)?:?/i, /פרטי\s*(הנכס|הדירה)/i, /מידע\s*על\s*(הנכס|הדירה)/i, /על\s*הנכס/i];
  let startIndex = 0;
  for (const marker of descriptionMarkers) {
    const match = markdown.search(marker);
    if (match > 0 && match < markdown.length / 2) { startIndex = match; break; }
  }
  
  const endMarkers = [/נכסים\s*דומים/i, /נכסים\s*נוספים/i, /צור\s*קשר/i, /שתף\s*(את\s*)?הנכס/i, /דווח\s*על\s*מודעה/i, /תנאי\s*שימוש/i];
  let endIndex = markdown.length;
  for (const marker of endMarkers) {
    const match = markdown.search(marker);
    if (match > startIndex && match < endIndex) { endIndex = match; break; }
  }
  
  const extracted = markdown.substring(startIndex, endIndex);
  if (extracted.length > 200 && extracted.length < markdown.length * 0.8) return extracted;
  return markdown;
}

function extractEntryDateInfo(markdown: string, source?: string): { entry_date: string | null; immediate_entry: boolean } {
  const hebrewMonths: Record<string, number> = {
    'ינואר': 1, 'פברואר': 2, 'מרץ': 3, 'אפריל': 4,
    'מאי': 5, 'יוני': 6, 'יולי': 7, 'אוגוסט': 8,
    'ספטמבר': 9, 'אוקטובר': 10, 'נובמבר': 11, 'דצמבר': 12,
  };

  const immediatePatterns = [
    /תאריך\s*כניסה\s*מיידי/i, /כניסה\s*מיידית/i, /כניסה\s*:?\s*מיידית/i,
    /כניסה\s*:?\s*מיידי/i, /immediate\s*entry/i, /תאריך\s*כניסה\s*גמיש/i,
    /כניסה\s*גמישה/i, /פנוי[הת]?\s*(?:לכניסה|מיד|עכשיו)/i, /פנוי[הת]?\s*$/im,
  ];
  for (const pattern of immediatePatterns) {
    if (pattern.test(markdown)) return { entry_date: null, immediate_entry: true };
  }

  const datePatterns = [
    /תאריך\s*כניסה\s*(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/i,
    /כניסה\s*:?\s*(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/i,
    /כניסה\s+(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})/i,
    /מועד\s*כניסה\s*:?\s*(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/i,
    /entry\s*date\s*:?\s*(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/i,
  ];
  for (const pattern of datePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      let year = parseInt(match[3]);
      if (year < 100) year += 2000;
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2024 && year <= 2030) {
        return { entry_date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, immediate_entry: false };
      }
    }
  }

  const hebrewMonthPattern = /כניסה\s*(?:ב|ל|in\s*)?-?\s*(?:(\d{1,2})\s*ב?)?\s*(ינואר|פברואר|מרץ|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר)\s*(\d{4})?/i;
  const hebrewMatch = markdown.match(hebrewMonthPattern);
  if (hebrewMatch) {
    const day = hebrewMatch[1] ? parseInt(hebrewMatch[1]) : 1;
    const monthName = hebrewMatch[2];
    const month = hebrewMonths[monthName];
    const year = hebrewMatch[3] ? parseInt(hebrewMatch[3]) : new Date().getFullYear();
    if (month && day >= 1 && day <= 31 && year >= 2024 && year <= 2030) {
      return { entry_date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, immediate_entry: false };
    }
  }

  return { entry_date: null, immediate_entry: true };
}
