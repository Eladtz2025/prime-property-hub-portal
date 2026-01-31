import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

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
  { pattern: /נווה\s*כפיר/i, real_city: 'פתח תקווה' },
  { pattern: /צופים/i, real_city: 'צופים (מזרח השומרון)' },
  { pattern: /קיסריה/i, real_city: 'קיסריה' },
  { pattern: /מעלה\s*אדומים/i, real_city: 'מעלה אדומים' },
  { pattern: /צמח\s*השדה/i, real_city: 'מעלה אדומים' },
  { pattern: /סמדר\s*עילית/i, real_city: 'יבנאל' },
  { pattern: /rishon\s*le?\s*zion/i, real_city: 'ראשון לציון' },
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

const BATCH_SIZE = 20;
const TASK_NAME = 'data_completion';

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
      auto_trigger = false // Flag for auto-triggered runs (after scout)
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
        .select('*')
        .eq('task_name', TASK_NAME)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      return new Response(JSON.stringify({ success: true, progress }), {
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

      const { count: totalCount } = await countQuery;

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

    const { data: properties, error } = await query;

    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }

    console.log(`📋 Batch: Found ${properties?.length || 0} properties to process`);

    // If no more properties, mark as completed
    if (!properties || properties.length === 0) {
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
          lastId = prop.id;
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';

        if (!markdown || markdown.length < 100) {
          console.log(`❌ No content scraped`);
          failCount++;
          lastId = prop.id;
          continue;
        }

        // Extract data
        const extracted = extractPropertyData(markdown, prop.source);
        const features = extractFeatures(markdown);
        
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
            .update({ is_active: false })
            .eq('id', prop.id);
          
          successCount++;
          lastId = prop.id;
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
              .update({ is_active: false })
              .eq('id', prop.id);
            
            successCount++;
            lastId = prop.id;
            continue;
          }
        }

        // Prepare update object with only missing fields
        const updates: Record<string, any> = {};
        
        if (!prop.rooms && extracted.rooms) updates.rooms = extracted.rooms;
        if (!prop.price && extracted.price) updates.price = extracted.price;
        if (!prop.size && extracted.size) updates.size = extracted.size;
        if (!prop.city && extracted.city) updates.city = extracted.city;
        if (!prop.floor && extracted.floor !== undefined) updates.floor = extracted.floor;
        if (!prop.neighborhood && extracted.neighborhood) updates.neighborhood = extracted.neighborhood;
        
        // Merge features - keep existing, add new
        const existingFeatures = prop.features || {};
        const hasNewFeatures = Object.keys(features).some(key => features[key as keyof PropertyFeatures] === true);
        if (hasNewFeatures || !prop.features) {
          updates.features = { ...existingFeatures, ...features };
        }

        // Detect broker/private classification from markdown
        if (prop.is_private === null || prop.is_private === undefined) {
          const isPrivate = detectBrokerFromMarkdown(markdown, prop.source);
          if (isPrivate !== null) {
            updates.is_private = isPrivate;
            console.log(`🏷️ Classified as: ${isPrivate ? 'פרטי' : 'תיווך'}`);
          }
        }

        if (Object.keys(updates).length === 0) {
          console.log(`⏭️ No new data to update`);
          lastId = prop.id;
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
            lastId = prop.id;
            continue;
          }
        }

        console.log(`✅ Updated with:`, JSON.stringify(updates));
        successCount++;
        lastId = prop.id;

        // Progress is updated at batch end to avoid too many DB calls

        // Delay between requests
        await new Promise(r => setTimeout(r, 1500));

      } catch (propError) {
        console.error(`Error processing ${prop.id}:`, propError);
        failCount++;
        lastId = prop.id;
      }
    }

    // Update progress with batch results
    const { data: currentProgress } = await supabase
      .from('backfill_progress')
      .select('processed_items, successful_items, failed_items, status')
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

    await supabase
      .from('backfill_progress')
      .update({
        processed_items: (currentProgress?.processed_items || 0) + properties.length,
        successful_items: (currentProgress?.successful_items || 0) + successCount,
        failed_items: (currentProgress?.failed_items || 0) + failCount,
        last_processed_id: lastId,
        updated_at: new Date().toISOString()
      })
      .eq('id', progressId);

    console.log(`\n📈 Batch complete: ${successCount} updated, ${failCount} failed`);

    // Check if there are more items
    const { count: remainingCount } = await supabase
      .from('scouted_properties')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('source_url', 'is', null)
      .neq('source_url', 'https://www.homeless.co.il')
      .or('rooms.is.null,price.is.null,size.is.null,features.is.null,is_private.is.null')
      .gt('id', lastId || '');

    const hasMore = (remainingCount || 0) > 0;

    if (hasMore) {
      // Trigger next batch via self-invocation
      console.log(`🔄 ${remainingCount} items remaining, triggering next batch...`);
      
      // Use EdgeRuntime.waitUntil for background continuation
      const continueUrl = `${supabaseUrl}/functions/v1/backfill-property-data`;
      fetch(continueUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'continue', task_id: progressId, dry_run })
      }).catch(err => console.error('Failed to trigger next batch:', err));
    } else {
      // Mark as completed
      await supabase
        .from('backfill_progress')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', progressId);
      
      console.log('✅ Backfill completed!');
    }

    return new Response(JSON.stringify({
      success: true,
      task_id: progressId,
      batch_processed: properties.length,
      batch_updated: successCount,
      batch_failed: failCount,
      has_more: hasMore,
      remaining: remainingCount || 0
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

/**
 * Extract features from property description - IMPROVED VERSION
 * 
 * Key improvements:
 * 1. Isolates the main property description section (avoids nav/footer)
 * 2. Uses context-aware patterns to reduce false positives
 * 3. Checks for negative patterns (e.g., "אין מרפסת", "ללא חניה")
 */
function extractFeatures(markdown: string): PropertyFeatures {
  const features: PropertyFeatures = {};
  
  // First, try to isolate the property description section
  const text = isolatePropertyDescription(markdown);
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

  // Balcony - positive context patterns
  if (hasFeature(
    [/יש\s*מרפסת/i, /כולל\s*מרפסת/i, /עם\s*מרפסת/i, /מרפסת\s*(שמש|גדולה|מרווחת|יפה)/i, /\bמרפסת\b.*מ"ר/i],
    [/אין\s*מרפסת/i, /ללא\s*מרפסת/i, /בלי\s*מרפסת/i]
  )) {
    features.balcony = true;
  }

  // Yard/Garden - specific patterns
  if (hasFeature(
    [/יש\s*(חצר|גינה)/i, /כולל\s*(חצר|גינה)/i, /עם\s*(חצר|גינה)/i, /\b(חצר|גינה)\s*(פרטית|גדולה|ירוקה)/i, /גן\s*פרטי/i, /דירת\s*גן/i],
    [/אין\s*(חצר|גינה)/i, /ללא\s*(חצר|גינה)/i, /בלי\s*(חצר|גינה)/i]
  )) {
    features.yard = true;
  }

  // Elevator - context patterns
  if (hasFeature(
    [/יש\s*מעלית/i, /כולל\s*מעלית/i, /עם\s*מעלית/i, /בניין\s*עם\s*מעלית/i, /\bמעלית\b/],
    [/אין\s*מעלית/i, /ללא\s*מעלית/i, /בלי\s*מעלית/i]
  )) {
    features.elevator = true;
  }

  // Parking - specific context
  if (hasFeature(
    [/יש\s*חניה/i, /כולל\s*חניה/i, /עם\s*חניה/i, /חניה\s*(פרטית|בטאבו|בבניין|בחניון)/i, /מקום\s*חניה/i, /חנייה/],
    [/אין\s*חניה/i, /ללא\s*חניה/i, /בלי\s*חניה/i]
  )) {
    features.parking = true;
  }

  // Mamad (safe room) - specific patterns (almost always contextual)
  if (hasFeature(
    [/יש\s*ממ"?ד/i, /כולל\s*ממ"?ד/i, /עם\s*ממ"?ד/i, /\bממ"ד\b/, /\bממד\b/, /מרחב\s*מוגן/i, /חדר\s*ביטחון/i],
    [/אין\s*ממ"?ד/i, /ללא\s*ממ"?ד/i]
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
 */
function isolatePropertyDescription(markdown: string): string {
  // If markdown is short, it's probably already isolated
  if (markdown.length < 2000) {
    return markdown;
  }

  // For Homeless pages, look for the main content section
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
function detectBrokerFromMarkdown(markdown: string, source: string): boolean | null {
  if (!markdown) return null;
  
  const textLower = markdown.toLowerCase();
  
  // === Source-specific logic ===
  
  // MADLAN: Check individual property page for broker info
  if (source === 'madlan') {
    // Look for "מתיווך" (from broker) - appears on property page
    const hasMativauch = /מתיווך/.test(markdown);
    // Look for license number with context (not plain 7 digits which catches phones)
    const hasLicenseWithContext = /(?:רישיון|ר\.?ת\.?|תיווך)\s*:?\s*\d{7,8}/.test(markdown);
    const hasAgencyName = /שם הסוכנות/.test(markdown);
    
    if (hasMativauch || hasLicenseWithContext || hasAgencyName) {
      console.log(`🔍 Madlan broker: mativauch=${hasMativauch}, license=${hasLicenseWithContext}, agency=${hasAgencyName}`);
      return false; // Broker
    }
    
    // Check for explicit private indicators
    const isExplicitlyPrivate = /ללא\s*(ה)?תיווך|לא\s*למתווכים|ללא\s*מתווכים/i.test(markdown);
    if (isExplicitlyPrivate) {
      console.log(`🔍 Madlan explicit private indicator found`);
      return true; // Private
    }
    
    return null; // Can't determine from markdown
  }
  
  // YAD2: Check for תיווך label with license
  if (source === 'yad2') {
    // Look for תיווך: with license number (not plain 7 digits)
    const hasTivuchWithLicense = /תיווך:?\s*\d{7}/.test(markdown);
    const hasExplicitLicense = /(?:רישיון|ר\.?ת\.?)\s*:?\s*\d{7}/.test(markdown);
    const hasExclusivity = /בבלעדיות/.test(markdown);
    
    // Known broker brands
    const BROKER_BRANDS = ['רימקס', 're/max', 'remax', 'אנגלו סכסון', 'century 21', 'קולדוול'];
    const hasBrokerBrand = BROKER_BRANDS.some(brand => textLower.includes(brand.toLowerCase()));
    
    if (hasTivuchWithLicense || hasExplicitLicense || hasExclusivity || hasBrokerBrand) {
      console.log(`🔍 Yad2 broker: tivuch+license=${hasTivuchWithLicense}, license=${hasExplicitLicense}, exclusivity=${hasExclusivity}, brand=${hasBrokerBrand}`);
      return false; // Broker
    }
    
    // Yad2 default: if no broker indicators, it's private
    return true;
  }
  
  // HOMELESS: Check for agency name
  if (source === 'homeless') {
    const hasAgencyName = /שם הסוכנות/.test(markdown);
    const hasAgentName = /שם הסוכן/.test(markdown);
    
    if (hasAgencyName || hasAgentName) {
      console.log(`🔍 Homeless broker: agency=${hasAgencyName}, agent=${hasAgentName}`);
      return false; // Broker
    }
    
    // Homeless default: if no broker indicators, it's private
    return true;
  }
  
  // Fallback for unknown sources: check for generic broker indicators
  const BROKER_BRANDS = ['רימקס', 're/max', 'remax', 'אנגלו סכסון', 'century 21', 'קולדוול'];
  const hasBrokerBrand = BROKER_BRANDS.some(brand => textLower.includes(brand.toLowerCase()));
  
  if (hasBrokerBrand) {
    console.log(`🔍 Generic broker brand found`);
    return false; // Broker
  }
  
  return null; // Can't determine
}
