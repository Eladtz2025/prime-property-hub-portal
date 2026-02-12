import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { detectBrokerFromMarkdown } from '../_shared/broker-detection.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// Blacklist Locations (Non-Tel Aviv)
// ============================================

/**
 * Locations that are NOT in Tel Aviv but often get mislabeled
 */
const BLACKLIST_LOCATIONS: Array<{ pattern: RegExp; real_city: string }> = [
  // Petah Tikva neighborhoods
  { pattern: /נווה\s*כפיר/i, real_city: 'פתח תקווה' },
  
  // Settlements
  { pattern: /צופים/i, real_city: 'צופים (מזרח השומרון)' },
  
  // Coastal cities
  { pattern: /קיסריה/i, real_city: 'קיסריה' },
  
  // Jerusalem area
  { pattern: /מעלה\s*אדומים/i, real_city: 'מעלה אדומים' },
  { pattern: /צמח\s*השדה/i, real_city: 'מעלה אדומים' },
  
  // Northern Israel
  { pattern: /סמדר\s*עילית/i, real_city: 'יבנאל' },
  { pattern: /רמות\s*נפתלי/i, real_city: 'רמות נפתלי' },
  { pattern: /קיבוץ\s*מחניים/i, real_city: 'קיבוץ מחניים' },
  
  // Moshavim
  { pattern: /מושב\s*כפר\s*דניאל/i, real_city: 'כפר דניאל' },
  
  // Even Yehuda (city, not the street!)
  { pattern: /,\s*אבן\s*יהודה$/i, real_city: 'אבן יהודה' },
  { pattern: /אבן\s*יהודה,\s*אבן\s*יהודה/i, real_city: 'אבן יהודה' },
  
  // Netanya area
  { pattern: /netanya/i, real_city: 'נתניה' },
  { pattern: /קרית\s*נורדאו/i, real_city: 'נתניה' },
  
  // English city names
  { pattern: /rishon\s*le?\s*zion/i, real_city: 'ראשון לציון' },
  { pattern: /herzliya(?!\s*pituach)/i, real_city: 'הרצליה' },
  { pattern: /ramat\s*gan/i, real_city: 'רמת גן' },
  { pattern: /givatayim/i, real_city: 'גבעתיים' },
  { pattern: /petah\s*tikva|petach\s*tikva/i, real_city: 'פתח תקווה' },
  { pattern: /holon/i, real_city: 'חולון' },
  { pattern: /bat\s*yam/i, real_city: 'בת ים' },
  
  // Kiryat cities
  { pattern: /קרית\s*מלאכי/i, real_city: 'קרית מלאכי' },
  { pattern: /קרית\s*גת/i, real_city: 'קרית גת' },
  { pattern: /קרית\s*אונו/i, real_city: 'קרית אונו' },
  { pattern: /קרית\s*ביאליק/i, real_city: 'קרית ביאליק' },
  { pattern: /קרית\s*מוצקין/i, real_city: 'קרית מוצקין' },
  { pattern: /קרית\s*ים/i, real_city: 'קרית ים' },
  { pattern: /קרית\s*אתא/i, real_city: 'קרית אתא' },
  { pattern: /קרית\s*שמונה/i, real_city: 'קרית שמונה' },
  
  // Yavneel (city, not street)
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
const BATCH_SIZE = 5;  // Reduced from 20 to avoid Edge Function timeout
const TASK_NAME = 'data_completion';

// ============================================
// Address Enrichment Helpers
// ============================================

/** Check if address already contains a house number (1-3 digits) */
function hasHouseNumber(address: string | null): boolean {
  if (!address) return false;
  return /\d{1,3}/.test(address);
}

/** Patterns indicating an invalid address (broker names, offices) */
const INVALID_ADDRESS_UPDATE_PATTERNS = [
  /נדל"?ן/i, /רימקס|re\/?max/i, /אנגלו\s*סכסון/i, /century\s*21/i,
  /קולדוול/i, /הומלנד/i, /Properties/i, /HomeMe/i, /Premium/i,
  /משרד\s*תיווך/i, /סוכנות/i, /Relocation/i, /REAL\s*ESTATE/i,
  /FRANCHI/i, /בית\s*ממכר/i, /ניהול\s*נכסים/i,
];

/** Validate that extracted address is safe to use */
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
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      action = 'start', 
      task_id, 
      dry_run = false,
      source_filter,      // Filter by source (yad2, homeless, madlan)
      only_recent = false, // Only process properties from last 30 min
      batch_size,          // Override default batch size
      auto_trigger = false, // Flag for auto-triggered runs (after scout)
      force_broker_reset = false // Reset unconfirmed broker values to null (manual only)
    } = await req.json().catch(() => ({}));

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
    let lastProcessedId: string | null = null;

    if (action === 'continue' && task_id) {
      // Continue existing task
      progressId = task_id;
      const { data: taskData } = await supabase
        .from('backfill_progress')
        .select('last_processed_id, status')
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
      
      lastProcessedId = taskData?.last_processed_id || null;
    } else if (existingTask && action === 'start') {
      // Check if task is stuck (older than 10 minutes)
      const taskAge = Date.now() - new Date(existingTask.updated_at).getTime();
      const isStuck = taskAge > 10 * 60 * 1000; // 10 minutes
      
      if (isStuck) {
        // Auto-stop stuck task
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
        // Continue to create a new task
      } else if (!auto_trigger) {
        // Return existing running task info (unless this is an auto-trigger which runs independently)
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Task already running',
          task_id: existingTask.id,
          progress: existingTask
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      // If stuck and auto-stopped, or if auto_trigger, continue to create new task
    }
    
    // Create new task (moved outside else block to handle stuck task recovery)
    if (!progressId!) {
      // Build count query with filters - now also includes is_private = null for broker classification
      // NOTE: We check for empty features {} in the processing loop, not in the query
      // because 'features.eq.{}' doesn't work correctly in Supabase .or() syntax
      let countQuery = supabase
        .from('scouted_properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('source_url', 'is', null)
        .neq('source_url', 'https://www.homeless.co.il')
        .or('rooms.is.null,price.is.null,size.is.null,features.is.null,is_private.is.null');

      // Apply source filter if specified
      if (source_filter) {
        countQuery = countQuery.eq('source', source_filter);
      }

      // Apply recent filter (last 30 minutes) for auto-triggered runs
      if (only_recent) {
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        countQuery = countQuery.gte('created_at', thirtyMinAgo);
      }

      const { count: nullFieldsCount } = await countQuery;

      // Also count properties with empty features {}
      let emptyFeaturesCountQuery = supabase
        .from('scouted_properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('source_url', 'is', null)
        .neq('source_url', 'https://www.homeless.co.il')
        .eq('features', {});

      if (source_filter) {
        emptyFeaturesCountQuery = emptyFeaturesCountQuery.eq('source', source_filter);
      }
      if (only_recent) {
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        emptyFeaturesCountQuery = emptyFeaturesCountQuery.gte('created_at', thirtyMinAgo);
      }

      const { count: emptyFeaturesCount } = await emptyFeaturesCountQuery;

      // Total is approximate (some may overlap)
      const totalCount = (nullFieldsCount || 0) + (emptyFeaturesCount || 0);

      // For auto-triggers, use a different task name to avoid conflicts
      const taskName = auto_trigger ? `${TASK_NAME}_auto_${source_filter || 'all'}` : TASK_NAME;

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
      
      const triggerType = auto_trigger ? '🤖 Auto-backfill' : '🚀 Manual backfill';
      const filterInfo = source_filter ? ` for ${source_filter}` : '';
      const recentInfo = only_recent ? ' (recent only)' : '';
      console.log(`${triggerType} task started${filterInfo}${recentInfo}: ${progressId}, total items: ${totalCount}`);
    }

    // Determine effective batch size
    const effectiveBatchSize = batch_size || BATCH_SIZE;

    // Build properties query with same filters - now also includes is_private
    // NOTE: We also fetch properties with empty features {} by checking in the loop
    let query = supabase
      .from('scouted_properties')
      .select('id, source_url, source, rooms, price, size, city, floor, neighborhood, address, title, features, is_private')
      .eq('is_active', true)
      .not('source_url', 'is', null)
      .neq('source_url', 'https://www.homeless.co.il')
      .or('rooms.is.null,price.is.null,size.is.null,features.is.null,is_private.is.null')
      .order('id', { ascending: true })
      .limit(effectiveBatchSize);

    // Apply source filter if specified
    if (source_filter) {
      query = query.eq('source', source_filter);
    }

    // Apply recent filter for auto-triggered runs
    if (only_recent) {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      query = query.gte('created_at', thirtyMinAgo);
    }

    if (lastProcessedId) {
      query = query.gt('id', lastProcessedId);
    }

    const { data: propertiesWithNulls, error } = await query;

    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }

    // Also fetch properties with empty features {} that might not have other null fields
    // This is a separate query because 'features.eq.{}' doesn't work in .or()
    let emptyFeaturesQuery = supabase
      .from('scouted_properties')
      .select('id, source_url, source, rooms, price, size, city, floor, neighborhood, address, title, features, is_private')
      .eq('is_active', true)
      .not('source_url', 'is', null)
      .neq('source_url', 'https://www.homeless.co.il')
      .eq('features', {})  // Empty JSONB object
      .order('id', { ascending: true })
      .limit(effectiveBatchSize);

    if (source_filter) {
      emptyFeaturesQuery = emptyFeaturesQuery.eq('source', source_filter);
    }
    if (only_recent) {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      emptyFeaturesQuery = emptyFeaturesQuery.gte('created_at', thirtyMinAgo);
    }
    if (lastProcessedId) {
      emptyFeaturesQuery = emptyFeaturesQuery.gt('id', lastProcessedId);
    }

    const { data: propertiesWithEmptyFeatures } = await emptyFeaturesQuery;

    // Third query: Properties needing address enrichment (address without house number)
    // PostgREST can't do regex, so we fetch candidates and filter in code
    let addressEnrichQuery = supabase
      .from('scouted_properties')
      .select('id, source_url, source, rooms, price, size, city, floor, neighborhood, address, title, features, is_private')
      .eq('is_active', true)
      .not('source_url', 'is', null)
      .neq('source_url', 'https://www.homeless.co.il')
      .not('address', 'is', null)
      // Target properties that already have core data (won't be caught by main query)
      .not('rooms', 'is', null)
      .not('price', 'is', null)
      .order('id', { ascending: true })
      .limit(effectiveBatchSize * 5); // Fetch more since we filter in code

    if (source_filter) {
      addressEnrichQuery = addressEnrichQuery.eq('source', source_filter);
    }
    if (only_recent) {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      addressEnrichQuery = addressEnrichQuery.gte('created_at', thirtyMinAgo);
    }
    if (lastProcessedId) {
      addressEnrichQuery = addressEnrichQuery.gt('id', lastProcessedId);
    }

    const { data: addressEnrichData } = await addressEnrichQuery;

    // Filter: only properties whose address lacks a house number
    const propertiesNeedingAddress = (addressEnrichData || [])
      .filter(p => !hasHouseNumber(p.address))
      .slice(0, effectiveBatchSize);

    // Merge all three lists, removing duplicates by ID
    const seenIds = new Set<string>();
    const properties: typeof propertiesWithNulls = [];
    
    for (const prop of propertiesWithNulls || []) {
      if (!seenIds.has(prop.id)) {
        seenIds.add(prop.id);
        properties.push(prop);
      }
    }
    for (const prop of propertiesWithEmptyFeatures || []) {
      if (!seenIds.has(prop.id)) {
        seenIds.add(prop.id);
        properties.push(prop);
      }
    }
    for (const prop of propertiesNeedingAddress) {
      if (!seenIds.has(prop.id)) {
        seenIds.add(prop.id);
        properties.push(prop);
      }
    }

    // Sort by ID to maintain consistent ordering
    properties.sort((a, b) => a.id.localeCompare(b.id));

    console.log(`📋 Batch: Found ${properties.length} properties to process (${propertiesWithNulls?.length || 0} with nulls, ${propertiesWithEmptyFeatures?.length || 0} with empty features, ${propertiesNeedingAddress.length} needing address)`);

    // If no more properties, mark as completed
    if (properties.length === 0) {
      await supabase
        .from('backfill_progress')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', progressId);

      console.log('✅ Backfill completed - no more items to process');
      
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
    let lastId = lastProcessedId;

    // Helper: save a recent_item to summary_data.recent_items (keeps last 10)
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
        // Keep only last 10
        if (recentItems.length > 10) recentItems.splice(0, recentItems.length - 10);
        summary.recent_items = recentItems;
        
        await supabase
          .from('backfill_progress')
          .update({ summary_data: summary, updated_at: new Date().toISOString() })
          .eq('id', progressId);
      } catch (e) {
        console.error('Failed to save recent_item:', e);
      }
    }

    // Detailed batch statistics for reporting
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
          lastId = prop.id;
          continue;
        }

        console.log(`\n🔍 Processing: ${prop.source_url}`);

        // Scrape the page
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: prop.source_url,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        if (!scrapeResponse.ok) {
          const errorText = await scrapeResponse.text();
          console.log(`❌ Scrape failed: ${errorText}`);
          failCount++;
          batchStats.scrape_failed++;
          batchStats.total_processed++;
          lastId = prop.id;
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

        const scrapeData = await scrapeResponse.json();
        const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';

        if (!markdown || markdown.length < 100) {
          console.log(`❌ No content scraped`);
          failCount++;
          batchStats.no_content++;
          batchStats.total_processed++;
          lastId = prop.id;
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

        // Extract data
        const extracted = extractPropertyData(markdown, prop.source);
        const features = extractFeatures(markdown, prop.source);
        
        console.log(`📊 Extracted data:`, JSON.stringify(extracted));
        console.log(`🏷️ Extracted features:`, JSON.stringify(features));

        // ========== BLACKLIST CHECK: Deactivate non-Tel-Aviv properties ==========
        // Check existing title/address for blacklisted locations (catches mislabeled properties)
        const existingText = `${prop.title || ''} ${prop.address || ''}`;
        const blacklistCheck = isBlacklistedLocation(existingText);
        if (blacklistCheck.blacklisted) {
          console.log(`🗑️ Property ${prop.id} blacklisted (${blacklistCheck.real_city}), marking inactive`);
          await supabase
            .from('scouted_properties')
            .update({ 
              is_active: false,
              status: 'inactive',
              availability_checked_at: new Date().toISOString(),
              availability_check_reason: `blacklisted_location_${blacklistCheck.real_city}`
            })
            .eq('id', prop.id);
          
          successCount++;
          batchStats.blacklisted++;
          batchStats.total_processed++;
          lastId = prop.id;
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
        
        // Check if property is not in Tel Aviv - mark as inactive
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
                availability_checked_at: new Date().toISOString(),
                availability_check_reason: `non_ta_city_${finalCity}`
              })
              .eq('id', prop.id);
            
            successCount++;
            batchStats.non_ta_deactivated++;
            batchStats.total_processed++;
            lastId = prop.id;
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

        // Prepare update object with only missing fields
        const updates: Record<string, any> = {};
        
        if (!prop.rooms && extracted.rooms) { updates.rooms = extracted.rooms; batchStats.fields_updated.rooms++; }
        if (!prop.price && extracted.price) { updates.price = extracted.price; batchStats.fields_updated.price++; }
        if (!prop.size && extracted.size) { updates.size = extracted.size; batchStats.fields_updated.size++; }
        if (!prop.city && extracted.city) { updates.city = extracted.city; batchStats.fields_updated.city++; }
        if (!prop.floor && extracted.floor !== undefined) { updates.floor = extracted.floor; batchStats.fields_updated.floor++; }
        if (!prop.neighborhood && extracted.neighborhood) { updates.neighborhood = extracted.neighborhood; batchStats.fields_updated.neighborhood++; }
        
        // Address enrichment: upgrade "street only" → "street + house number"
        // SAFETY: Only upgrade if current address lacks a number AND new one has a valid number
        if (prop.address && !hasHouseNumber(prop.address)) {
          batchStats.address_attempted_upgrade++;
          const pageAddress = extractAddressFromPage(markdown, prop.source);
          if (pageAddress && pageAddress.houseNumber >= 1 && pageAddress.houseNumber <= 999) {
            if (!isValidAddressForUpdate(pageAddress.fullAddress)) {
              console.log(`⚠️ Address validation failed: "${pageAddress.fullAddress}" - skipping`);
              batchStats.address_validation_failed++;
            } else {
              // Verify the extracted street relates to the existing address (don't replace with something different)
              const existingNorm = prop.address.replace(/[\s'".\-\/]+/g, ' ').trim();
              const newStreetNorm = pageAddress.street.replace(/[\s'".\-\/]+/g, ' ').trim();
              if (newStreetNorm.includes(existingNorm) || existingNorm.includes(newStreetNorm)) {
                updates.address = pageAddress.fullAddress;
                updates.duplicate_check_possible = true;
                batchStats.address_upgraded++;
                console.log(`📍 Address upgraded: "${prop.address}" → "${pageAddress.fullAddress}"`);
              } else {
                batchStats.address_street_mismatch++;
                console.log(`⚠️ Address street mismatch: existing="${prop.address}", extracted="${pageAddress.fullAddress}" - skipping`);
              }
            }
          } else {
            batchStats.address_no_number_in_source++;
          }
        } else if (!prop.address) {
          // No address at all - try to extract one from page
          const pageAddress = extractAddressFromPage(markdown, prop.source);
          if (pageAddress) {
            updates.address = pageAddress.fullAddress;
            batchStats.address_set_from_scratch++;
            console.log(`📍 Address set from page: "${pageAddress.fullAddress}"`);
          } else {
            batchStats.address_no_address++;
          }
        } else {
          batchStats.address_already_has_number++;
        }
        
        // Merge features - keep existing, add new (also update if features is empty object)
        const existingFeatures = prop.features || {};
        const existingIsEmpty = !prop.features || Object.keys(prop.features).length === 0;
        const hasNewFeatures = Object.keys(features).some(key => features[key as keyof PropertyFeatures] === true);
        if (hasNewFeatures || existingIsEmpty) {
          updates.features = { ...existingFeatures, ...features };
          batchStats.features_updated++;
        }

        // Detect broker/private classification from markdown
        // For Madlan: always re-evaluate (fix historical false-broker bias)
        // For other sources: only classify when unknown
        const shouldClassifyBroker = prop.source === 'madlan' 
          || prop.is_private === null 
          || prop.is_private === undefined;

        if (shouldClassifyBroker) {
          const isPrivate = detectBrokerFromMarkdown(markdown, prop.source);
          if (isPrivate !== null) {
            // Got a definitive answer → update
            updates.is_private = isPrivate;
            batchStats.broker_classified++;
            console.log(`🏷️ Classified as: ${isPrivate ? 'פרטי' : 'תיווך'}`);
          } else if (force_broker_reset && prop.source === 'madlan' && prop.is_private === false) {
            // Optional reset: force_broker_reset flag + Madlan + was false-broker → null
            updates.is_private = null;
            batchStats.broker_reset_to_unknown++;
            console.log(`🏷️ Madlan: reset false-broker → unknown (force_broker_reset)`);
          }
          // else: null result + no force_reset → keep existing value unchanged
        }

        if (Object.keys(updates).length === 0) {
          console.log(`⏭️ No new data to update`);
          batchStats.no_new_data++;
          batchStats.total_processed++;
          lastId = prop.id;
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
          const { error: updateError } = await supabase
            .from('scouted_properties')
            .update(updates)
            .eq('id', prop.id);

          if (updateError) {
            console.log(`❌ Update failed:`, updateError);
            failCount++;
            batchStats.update_db_error++;
            batchStats.total_processed++;
            lastId = prop.id;
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

        // Build recent item for successful update
        const fieldsFound = Object.keys(extracted).filter(k => (extracted as any)[k] != null);
        const fieldsUpdated = Object.keys(updates).filter(k => !['features', 'is_private', 'duplicate_check_possible'].includes(k));
        const brokerResult = updates.is_private !== undefined 
          ? (updates.is_private === true ? 'private' : updates.is_private === false ? 'broker' : null)
          : null;
        const addressAction = updates.address 
          ? (prop.address ? 'upgraded' : 'set_new')
          : null;

        console.log(`✅ Updated with:`, JSON.stringify(updates));
        successCount++;
        batchStats.total_processed++;
        lastId = prop.id;

        // Update last_processed_id incrementally
        await supabase
          .from('backfill_progress')
          .update({
            last_processed_id: lastId,
            updated_at: new Date().toISOString()
          })
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
        lastId = prop.id;
      }
    }

    // Update progress with batch results + summary_data
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

    // Merge batch stats with existing summary_data (cumulative)
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
    // Merge fields_updated sub-object
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
        last_processed_id: lastId,
        summary_data: mergedSummary,
        updated_at: new Date().toISOString()
      })
      .eq('id', progressId);

    // Batch address report log
    console.log(`\n📊 Batch Address Report:
  🏠 upgraded (street→street+num): ${batchStats.address_upgraded}
  🔍 attempted upgrade: ${batchStats.address_attempted_upgrade}
  ❌ no number in source page: ${batchStats.address_no_number_in_source}
  ⚠️ street mismatch (skipped): ${batchStats.address_street_mismatch}
  🚫 validation failed: ${batchStats.address_validation_failed}
  ✅ already has number: ${batchStats.address_already_has_number}
  🆕 set from scratch: ${batchStats.address_set_from_scratch}`);
    
    console.log(`📊 Batch Field Report:
  🏷️ broker classified: ${batchStats.broker_classified}
  🏷️ features updated: ${batchStats.features_updated}
  📋 fields: rooms=${batchStats.fields_updated.rooms} price=${batchStats.fields_updated.price} size=${batchStats.fields_updated.size} floor=${batchStats.fields_updated.floor}
  🗑️ blacklisted: ${batchStats.blacklisted} | non-TA: ${batchStats.non_ta_deactivated}
  ⏭️ no new data: ${batchStats.no_new_data} | scrape_failed: ${batchStats.scrape_failed}
  📈 Batch total: ${successCount} updated, ${failCount} failed`);

    // Check if there are more items (null fields, empty features, address enrichment)
    const { count: remainingNullCount } = await supabase
      .from('scouted_properties')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('source_url', 'is', null)
      .neq('source_url', 'https://www.homeless.co.il')
      .or('rooms.is.null,price.is.null,size.is.null,features.is.null,is_private.is.null')
      .gt('id', lastId || '');

    const { count: remainingEmptyFeaturesCount } = await supabase
      .from('scouted_properties')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('source_url', 'is', null)
      .neq('source_url', 'https://www.homeless.co.il')
      .eq('features', {})
      .gt('id', lastId || '');

    // Check for remaining address enrichment candidates (sample-based, can't regex in PostgREST)
    let remainingAddrQuery = supabase
      .from('scouted_properties')
      .select('id, address')
      .eq('is_active', true)
      .not('source_url', 'is', null)
      .neq('source_url', 'https://www.homeless.co.il')
      .not('address', 'is', null)
      .not('rooms', 'is', null)
      .not('price', 'is', null)
      .gt('id', lastId || '')
      .limit(30);
    if (source_filter) {
      remainingAddrQuery = remainingAddrQuery.eq('source', source_filter);
    }
    const { data: remainingAddrSample } = await remainingAddrQuery;
    const hasRemainingAddressWork = (remainingAddrSample || []).some(p => !hasHouseNumber(p.address));

    // Approximate remaining (may have some overlap, but that's fine for progress display)
    const remainingCount = Math.max(remainingNullCount || 0, remainingEmptyFeaturesCount || 0, hasRemainingAddressWork ? 1 : 0);

    const hasMore = remainingCount > 0;

    if (hasMore) {
      // Trigger next batch via self-invocation - MUST await to ensure request is dispatched
      console.log(`🔄 ${remainingCount} items remaining, triggering next batch...`);
      
      const continueUrl = `${supabaseUrl}/functions/v1/backfill-property-data`;
      try {
        // CRITICAL: await the fetch to ensure request is sent before function closes
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
            source_filter,  // Pass through source filter
            force_broker_reset  // Pass through reset flag
          })
        });
        
        if (!triggerResponse.ok) {
          console.error(`Failed to trigger next batch: ${triggerResponse.status}`);
        } else {
          console.log(`✅ Next batch triggered successfully`);
        }
      } catch (err) {
        console.error('Failed to trigger next batch:', err);
      }
    } else {
      // Mark as completed with final summary
      await supabase
        .from('backfill_progress')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          summary_data: mergedSummary,
          updated_at: new Date().toISOString()
        })
        .eq('id', progressId);
      
      console.log(`🏁 BACKFILL COMPLETE - Final Summary:
  Total processed: ${mergedSummary.total_processed}
  Address upgraded: ${mergedSummary.address_upgraded} / ${mergedSummary.address_attempted_upgrade} attempted
  No number in source: ${mergedSummary.address_no_number_in_source}
  Street mismatch: ${mergedSummary.address_street_mismatch}
  Features updated: ${mergedSummary.features_updated}
  Broker classified: ${mergedSummary.broker_classified}
  Fields: rooms=${mergedSummary.fields_updated?.rooms} price=${mergedSummary.fields_updated?.price} size=${mergedSummary.fields_updated?.size}`);
    }

    return new Response(JSON.stringify({
      success: true,
      task_id: progressId,
      batch_processed: properties.length,
      batch_updated: successCount,
      batch_failed: failCount,
      has_more: hasMore,
      remaining: remainingCount || 0,
      address_stats: {
        attempted_upgrade: batchStats.address_attempted_upgrade,
        upgraded: batchStats.address_upgraded,
        no_number_in_source: batchStats.address_no_number_in_source,
        street_mismatch: batchStats.address_street_mismatch,
        validation_failed: batchStats.address_validation_failed,
        already_has_number: batchStats.address_already_has_number,
        set_from_scratch: batchStats.address_set_from_scratch,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function extractPropertyData(markdown: string, source: string): PropertyData {
  const data: PropertyData = {};

  // Extract rooms
  const roomPatterns = [
    /(\d+\.?\d*)\s*חדר/i,
    /חדרים[:\s]+(\d+\.?\d*)/i,
    /rooms[:\s]+(\d+\.?\d*)/i,
    /(\d+\.?\d*)\s*rooms/i,
  ];
  for (const pattern of roomPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const rooms = parseFloat(match[1]);
      if (rooms >= 1 && rooms <= 15) {
        data.rooms = rooms;
        break;
      }
    }
  }

  // Extract price
  const pricePatterns = [
    /₪\s*([\d,]+)/,
    /([\d,]+)\s*₪/,
    /מחיר[:\s]*([\d,]+)/,
    /price[:\s]*([\d,]+)/i,
    /([\d,]{4,})\s*ש"ח/,
    /([\d,]{4,})\s*שקל/,
  ];
  for (const pattern of pricePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const price = parseInt(match[1].replace(/,/g, ''));
      if (price >= 1000 && price <= 50000000) {
        data.price = price;
        break;
      }
    }
  }

  // Extract size - FIXED: Only extract from MAIN content (before "related ads" section)
  // This prevents grabbing sizes from "מודעות דומות" section which often appear first in regex matches
  const mainContent = markdown.split(/עוד מודעות|מודעות דומות|עוד חיפושים|מודעות נוספות/i)[0] || markdown;
  
  const sizePatterns = [
    /מ"ר[:\s]*(\d+)/,        // "מ"ר: 70" format (labeled - highest priority)
    /שטח[:\s]*(\d+)/,        // "שטח: 70" format (labeled)
    /(\d+)\s*מ"ר(?!\s*[•|])/i, // "70 מ"ר" but NOT followed by bullet (avoids related ads list format)
    /(\d+)\s*מטר\s*רבוע/i,   // "70 מטר רבוע" (explicit)
    /(\d+)\s*sqm/i,
    /(\d+)\s*sq\.?\s*m/i,
    /size[:\s]*(\d+)/i,
  ];
  for (const pattern of sizePatterns) {
    const match = mainContent.match(pattern);
    if (match) {
      const size = parseInt(match[1]);
      if (size >= 20 && size <= 1000) {
        data.size = size;
        break;
      }
    }
  }

  // Extract floor
  const floorPatterns = [
    /קומה[:\s]*(\d+)/,
    /floor[:\s]*(\d+)/i,
    /(\d+)\s*קומה/,
  ];
  for (const pattern of floorPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const floor = parseInt(match[1]);
      if (floor >= 0 && floor <= 50) {
        data.floor = floor;
        break;
      }
    }
  }

  // Extract city
  const cities = [
    'תל אביב', 'תל-אביב', 'רמת גן', 'גבעתיים', 'הרצליה', 'רעננה', 
    'כפר סבא', 'פתח תקווה', 'ראשון לציון', 'חולון', 'בת ים',
    'נתניה', 'אשדוד', 'באר שבע', 'חיפה', 'ירושלים', 'בני ברק',
    'הוד השרון', 'רחובות', 'נס ציונה', 'אור יהודה', 'יהוד'
  ];
  
  for (const city of cities) {
    if (markdown.includes(city)) {
      data.city = city.replace('-', ' ');
      break;
    }
  }

  // Extract neighborhood
  const neighborhoods = [
    'צפון ישן', 'צפון חדש', 'כיכר המדינה', 'לב העיר', 'מרכז העיר',
    'בבלי', 'נווה צדק', 'כרם התימנים', 'רמת אביב', 'פלורנטין',
    'צהלה', 'רוטשילד', 'נמל תל אביב', 'נחלת בנימין', 'שרונה',
    'לב תל אביב', 'יפו', 'עג\'מי', 'נוה שאנן'
  ];
  
  for (const neighborhood of neighborhoods) {
    if (markdown.includes(neighborhood)) {
      data.neighborhood = neighborhood;
      break;
    }
  }

  return data;
}

// ============================================
// Address Extraction from Individual Property Pages
// ============================================

/**
 * Extract full address (street + house number) from individual property page markdown.
 * Returns null if no reliable house number found.
 */
function extractAddressFromPage(
  markdown: string,
  source: string
): { street: string; houseNumber: number; fullAddress: string } | null {
  if (!markdown || markdown.length < 50) return null;
  
  if (source === 'yad2') {
    return extractYad2PageAddress(markdown);
  }
  if (source === 'madlan') {
    return extractMadlanPageAddress(markdown);
  }
  return null;
}

/**
 * Yad2 individual page title formats:
 * "# שדרות בן ציון 31 דירה, הצפון הישן - דרום, תל אביב יפו"
 * "# ויצמן 82"
 * "## ארלוזורוב 15 דירה, ..."
 */
function extractYad2PageAddress(
  markdown: string
): { street: string; houseNumber: number; fullAddress: string } | null {
  const patterns = [
    // Heading: # HebrewStreet Number PropertyType/comma
    /^#{1,3}\s*([\u0590-\u05FF][\u0590-\u05FF\s'".\-\/]*?)\s+(\d{1,3})\s*(?:[,\s]*(?:דירה|דירת|גג|פנטהאוז|סטודיו|בית))/m,
    // Heading: # HebrewStreet Number (end of line)
    /^#{1,3}\s*([\u0590-\u05FF][\u0590-\u05FF\s'".\-\/]*?)\s+(\d{1,3})\s*$/m,
    // Bold heading: **HebrewStreet Number**
    /\*\*([\u0590-\u05FF][\u0590-\u05FF\s'".\-\/]*?)\s+(\d{1,3})\*\*/,
    // "כתובת: HebrewStreet Number"
    /כתובת[:\s]+([\u0590-\u05FF][\u0590-\u05FF\s'".\-\/]*?)\s+(\d{1,3})(?:\s|,|$)/,
  ];
  
  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match) {
      const street = match[1].trim();
      const houseNumber = parseInt(match[2], 10);
      if (houseNumber >= 1 && houseNumber <= 999 && street.length >= 2) {
        const fullAddress = `${street} ${houseNumber}`;
        if (isValidAddressForUpdate(fullAddress)) {
          return { street, houseNumber, fullAddress };
        }
      }
    }
  }
  return null;
}

/**
 * Madlan individual page formats:
 * "# דירה, ויצמן 82, צפון חדש, תל אביב יפו"
 * "# דירה להשכרה, שלום עליכם 30, הצפון החדש"
 */
function extractMadlanPageAddress(
  markdown: string
): { street: string; houseNumber: number; fullAddress: string } | null {
  const patterns = [
    // After property type: "דירה, Street Number, ..."
    /(?:דירה|דירת\s*גן|פנטהאוז|סטודיו|גג|קוטג'?|בית\s*פרטי)[^,]*,\s*([\u0590-\u05FF][\u0590-\u05FF\s'".\-\/]*?)\s+(\d{1,3})\s*(?:,|$)/m,
    // Heading with street number
    /^#{1,3}\s*.*?([\u0590-\u05FF][\u0590-\u05FF\s'".\-\/]*?)\s+(\d{1,3})\s*(?:,|$)/m,
  ];
  
  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match) {
      const street = match[1].trim();
      const houseNumber = parseInt(match[2], 10);
      if (houseNumber >= 1 && houseNumber <= 999 && street.length >= 2) {
        const fullAddress = `${street} ${houseNumber}`;
        if (isValidAddressForUpdate(fullAddress)) {
          return { street, houseNumber, fullAddress };
        }
      }
    }
  }
  return null;
}

/**
 * Extract features from property description - IMPROVED VERSION
 * 
 * Key improvements:
 * 1. Isolates the main property description section (avoids nav/footer)
 * 2. Uses context-aware patterns to reduce false positives
 * 3. Checks for negative patterns (e.g., "אין מרפסת", "ללא חניה")
 */
function extractFeatures(markdown: string, source?: string): PropertyFeatures {
  const features: PropertyFeatures = {};
  
  // First, try to isolate the property description section
  // For Madlan: excludes "מפרט מלא" which shows ALL options (not just existing ones)
  const text = isolatePropertyDescription(markdown, source);
  const lowerText = text.toLowerCase();

  // Helper to check for positive mention without negation
  const hasFeature = (positivePatterns: RegExp[], negativePatterns: RegExp[] = []): boolean => {
    // Check if any negative pattern matches
    for (const neg of negativePatterns) {
      if (neg.test(text)) {
        return false;
      }
    }
    // Check if any positive pattern matches
    for (const pos of positivePatterns) {
      if (pos.test(text)) {
        return true;
      }
    }
    return false;
  };

  // Balcony - positive context patterns (expanded)
  if (hasFeature(
    [
      /יש\s*מרפסת/i, /כולל\s*מרפסת/i, /עם\s*מרפסת/i, 
      /מרפסת\s*(שמש|גדולה|מרווחת|יפה|קטנה|רחבה)/i, 
      /\bמרפסת\b.*מ"ר/i,
      /\d+\s*מרפס[תו]ת/i,  // "2 מרפסות"
      /מרפסות/i,           // plural
      /\bמרפסת\b/          // simple mention (fallback)
    ],
    [/אין\s*מרפסת/i, /ללא\s*מרפסת/i, /בלי\s*מרפסת/i]
  )) {
    features.balcony = true;
  }

  // Yard/Garden - specific patterns (expanded)
  if (hasFeature(
    [
      /יש\s*(חצר|גינה)/i, /כולל\s*(חצר|גינה)/i, /עם\s*(חצר|גינה)/i, 
      /\b(חצר|גינה)\s*(פרטית|גדולה|ירוקה|משותפת)/i, 
      /גן\s*פרטי/i, /דירת\s*גן/i,
      /גינה\s*פרטית/i,     // explicit private garden
      /\bדשא\b/i,          // lawn
      /\bפטיו\b/i,         // patio
      /\bחצר\b/            // simple mention (fallback)
    ],
    [/אין\s*(חצר|גינה)/i, /ללא\s*(חצר|גינה)/i, /בלי\s*(חצר|גינה)/i]
  )) {
    features.yard = true;
  }

  // Elevator - context patterns (expanded)
  if (hasFeature(
    [
      /יש\s*מעלית/i, /כולל\s*מעלית/i, /עם\s*מעלית/i, 
      /בניין\s*עם\s*מעלית/i, 
      /מעלית\s*שבת/i,      // Shabbat elevator
      /\d+\s*מעליות/i,     // "2 מעליות"
      /\bמעלית\b/          // simple mention (fallback)
    ],
    [/אין\s*מעלית/i, /ללא\s*מעלית/i, /בלי\s*מעלית/i, /בלעדי\s*מעלית/i]
  )) {
    features.elevator = true;
  }

  // Parking - specific context (expanded)
  if (hasFeature(
    [
      /יש\s*חניה/i, /כולל\s*חניה/i, /עם\s*חניה/i, 
      /חניה\s*(פרטית|בטאבו|בבניין|בחניון|מקורה|תת\s*קרקעית)/i, 
      /מקום\s*חניה/i, /חנייה/,
      /\d+\s*חניות/i,      // "2 חניות"
      /חניון/i,            // parking garage
      /\bחניה\b/           // simple mention (fallback)
    ],
    [/אין\s*חניה/i, /ללא\s*חניה/i, /בלי\s*חניה/i]
  )) {
    features.parking = true;
  }

  // Mamad (safe room) - specific patterns (expanded)
  if (hasFeature(
    [
      /יש\s*ממ"?ד/i, /כולל\s*ממ"?ד/i, /עם\s*ממ"?ד/i, 
      /\bממ"ד\b/, /\bממד\b/, 
      /מרחב\s*מוגן/i, /חדר\s*ביטחון/i,
      /ממ"?ד\s*צמוד/i,     // attached mamad
      /ממ"?ד\s*קומתי/i     // floor mamad
    ],
    [/אין\s*ממ"?ד/i, /ללא\s*ממ"?ד/i, /בלי\s*ממ"?ד/i]
  )) {
    features.mamad = true;
  }

  // Storage - context patterns
  if (hasFeature(
    [/יש\s*מחסן/i, /כולל\s*מחסן/i, /עם\s*מחסן/i, /\bמחסן\b\s*(פרטי|גדול|בבניין)/i, /מחסן\s*ו?חניה/i],
    [/אין\s*מחסן/i, /ללא\s*מחסן/i]
  )) {
    features.storage = true;
  }

  // Roof/Penthouse - specific patterns
  if (hasFeature(
    [/גג\s*(פרטי|צמוד|מרווח)/i, /גישה\s*לגג/i, /פנטהאו[זס]/i, /דירת\s*גג/i],
    []
  )) {
    features.roof = true;
  }

  // Air conditioning - context patterns
  if (hasFeature(
    [/יש\s*מזגנ?/i, /כולל\s*מזגנ?/i, /עם\s*מזגנ?/i, /מזגנים/i, /מיזוג\s*(אוויר|מרכזי)/i, /מיזוג\s*בכל/i],
    [/אין\s*מזגנ?/i, /ללא\s*מזגנ?/i]
  )) {
    features.aircon = true;
  }

  // Renovated - context patterns
  if (hasFeature(
    [/משופצ[תת]/i, /שיפוץ\s*(יסודי|מלא|חדש)/i, /לאחר\s*שיפוץ/i, /חדש\s*מהניילון/i, /שופץ\s*(לאחרונה|ב\d{4})/i],
    []
  )) {
    features.renovated = true;
  }

  // Furnished - context patterns  
  if (hasFeature(
    [/מרוהט[תת]?\s*(במלואה|חלקית)?/i, /כולל\s*ריהוט/i, /עם\s*ריהוט/i, /ריהוט\s*(מלא|חלקי)/i],
    [/לא\s*מרוהט/i, /ללא\s*ריהוט/i, /ריק[הה]?\s*מריהוט/i]
  )) {
    features.furnished = true;
  }

  // Accessible - VERY specific patterns (avoid "נגישות לאתר" false positives)
  if (hasFeature(
    [/נגיש\s+לנכים/i, /מותאם\s+לנכים/i, /גישה\s+לכיסא\s+גלגלים/i, /נגישות\s+לנכים/i, /דירה\s+נגישה/i, /נגיש\s+לנפי\s+תנועה/i],
    [/נגישות\s*לאתר/i, /תנאי\s*נגישות/i, /הצהרת\s*נגישות/i]
  )) {
    features.accessible = true;
  }

  // Pets allowed - context patterns
  if (hasFeature(
    [/מותר\s*(חיות|בע"ח)/i, /חיות\s*מחמד\s*(מותר|אפשר)/i, /ידידותי\s*לחיות/i, /pet\s*friendly/i],
    [/אסור\s*חיות/i, /ללא\s*חיות/i, /לא\s*מותר\s*חיות/i]
  )) {
    features.pets = true;
  }

  return features;
}

/**
 * Try to isolate just the property description from full page markdown
 * This helps avoid matching features from navigation, filters, etc.
 * 
 * CRITICAL for Madlan: The "מפרט מלא" section lists ALL possible features
 * (both existing and non-existing). The checkmarks (✓/✗) are visual only
 * and don't appear in markdown. We must EXCLUDE this section entirely.
 */
function isolatePropertyDescription(markdown: string, source?: string): string {
  // CRITICAL: For Madlan, exclude "מפרט מלא" section completely
  // This section shows ALL options with visual checkmarks that don't translate to markdown
  // Only use "יתרונות הנכס" (advantages) and "תיאור הנכס" (description) sections
  if (source === 'madlan') {
    let text = '';
    
    // Extract "יתרונות הנכס" section - these are ACTUAL features that exist
    const advantagesMatch = markdown.match(/יתרונות הנכס([\s\S]*?)(?:##|תיאור הנכס|מפרט מלא|מידע נוסף|$)/i);
    if (advantagesMatch) {
      text += advantagesMatch[1] + '\n';
    }
    
    // Extract "תיאור הנכס" section - free text description
    const descriptionMatch = markdown.match(/תיאור הנכס([\s\S]*?)(?:##|מפרט מלא|מידע נוסף|צור קשר|$)/i);
    if (descriptionMatch) {
      text += descriptionMatch[1] + '\n';
    }
    
    // If we found meaningful content from these sections, use it
    if (text.length > 50) {
      console.log(`[Madlan] Using יתרונות/תיאור sections only (${text.length} chars), avoiding מפרט מלא`);
      return text;
    }
    
    // Fallback: remove "מפרט מלא" section entirely from the markdown
    const cleaned = markdown.replace(/##?\s*מפרט מלא[\s\S]*?(?=##|מידע נוסף|צור קשר|$)/gi, '');
    console.log(`[Madlan] Fallback: removed מפרט מלא section (${markdown.length} -> ${cleaned.length} chars)`);
    return cleaned;
  }

  // If markdown is short, it's probably already isolated
  if (markdown.length < 2000) {
    return markdown;
  }

  // For Homeless/Yad2 pages, look for the main content section
  // Usually starts after the breadcrumb/header and ends before footer
  
  // Try to find description markers
  const descriptionMarkers = [
    /תיאור\s*(הנכס|הדירה)?:?/i,
    /פרטי\s*(הנכס|הדירה)/i,
    /מידע\s*על\s*(הנכס|הדירה)/i,
    /על\s*הנכס/i
  ];
  
  let startIndex = 0;
  for (const marker of descriptionMarkers) {
    const match = markdown.search(marker);
    if (match > 0 && match < markdown.length / 2) {
      startIndex = match;
      break;
    }
  }
  
  // Try to find end markers (footer, related listings, etc.)
  const endMarkers = [
    /נכסים\s*דומים/i,
    /נכסים\s*נוספים/i,
    /צור\s*קשר/i,
    /שתף\s*(את\s*)?הנכס/i,
    /דווח\s*על\s*מודעה/i,
    /תנאי\s*שימוש/i
  ];
  
  let endIndex = markdown.length;
  for (const marker of endMarkers) {
    const match = markdown.search(marker);
    if (match > startIndex && match < endIndex) {
      endIndex = match;
      break;
    }
  }
  
  // Extract the relevant portion
  const extracted = markdown.substring(startIndex, endIndex);
  
  // If we extracted a reasonable portion, use it; otherwise use full text
  if (extracted.length > 200 && extracted.length < markdown.length * 0.8) {
    return extracted;
  }
  
  return markdown;
}

/**
 * Detect if property is private or broker based on markdown content
 * Uses source-specific logic with careful regex to avoid phone number false positives
 */
// detectBrokerFromMarkdown is now imported from _shared/broker-detection.ts
