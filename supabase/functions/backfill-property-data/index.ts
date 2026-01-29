import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { action = 'start', task_id, dry_run = false } = await req.json().catch(() => ({}));

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
      // Return existing running task info
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Task already running',
        task_id: existingTask.id,
        progress: existingTask
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Start new task - count total items first
      const { count: totalCount } = await supabase
        .from('scouted_properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('source_url', 'is', null)
        .neq('source_url', 'https://www.homeless.co.il')
        .or('rooms.is.null,price.is.null,size.is.null,features.is.null');

      const { data: newTask, error: insertError } = await supabase
        .from('backfill_progress')
        .insert({
          task_name: TASK_NAME,
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
      
      console.log(`🚀 New backfill task started: ${progressId}, total items: ${totalCount}`);
    }

    // Get properties with missing data
    let query = supabase
      .from('scouted_properties')
      .select('id, source_url, source, rooms, price, size, city, floor, neighborhood, address, title, features')
      .eq('is_active', true)
      .not('source_url', 'is', null)
      .neq('source_url', 'https://www.homeless.co.il')
      .or('rooms.is.null,price.is.null,size.is.null,features.is.null')
      .order('id', { ascending: true })
      .limit(BATCH_SIZE);

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

        // Update progress after each property
        await supabase.rpc('increment_backfill_progress', {
          p_task_id: progressId,
          p_success: 1,
          p_fail: 0,
          p_last_id: prop.id
        }).catch(() => {
          // Fallback if RPC doesn't exist
          supabase
            .from('backfill_progress')
            .update({
              processed_items: supabase.rpc('', {}), // Will use direct update below
              updated_at: new Date().toISOString()
            })
            .eq('id', progressId);
        });

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
      .or('rooms.is.null,price.is.null,size.is.null,features.is.null')
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

  // Extract size
  const sizePatterns = [
    /(\d+)\s*מ"ר/,
    /(\d+)\s*מטר/,
    /(\d+)\s*sqm/i,
    /(\d+)\s*sq\.?\s*m/i,
    /שטח[:\s]*(\d+)/,
    /size[:\s]*(\d+)/i,
  ];
  for (const pattern of sizePatterns) {
    const match = markdown.match(pattern);
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

function extractFeatures(markdown: string): PropertyFeatures {
  const features: PropertyFeatures = {};
  const text = markdown.toLowerCase();

  // Balcony
  if (/מרפסת|balcon|mirpeset|מרפסת שמש|מרפסת גדולה/.test(text)) {
    features.balcony = true;
  }

  // Yard/Garden
  if (/חצר|גינה|גן פרטי|garden|yard|גינה פרטית|חצר פרטית/.test(text)) {
    features.yard = true;
  }

  // Elevator
  if (/מעלית|elevator|lift/.test(text)) {
    features.elevator = true;
  }

  // Parking
  if (/חניה|חנייה|parking|חניון|מקום חניה/.test(text)) {
    features.parking = true;
  }

  // Mamad (safe room)
  if (/ממ"ד|ממד|מרחב מוגן|mamad|safe room|חדר ביטחון/.test(text)) {
    features.mamad = true;
  }

  // Storage
  if (/מחסן|storage|אחסון/.test(text)) {
    features.storage = true;
  }

  // Roof/Penthouse
  if (/גג|פנטהאוז|penthouse|roof|גג פרטי|גישה לגג/.test(text)) {
    features.roof = true;
  }

  // Air conditioning
  if (/מזגן|מיזוג|מזגנים|air.?condition|a\/c|מיזוג אוויר/.test(text)) {
    features.aircon = true;
  }

  // Renovated
  if (/משופצ|שיפוץ|renovated|שופץ|חדש/.test(text)) {
    features.renovated = true;
  }

  // Furnished
  if (/מרוהט|ריהוט|furnished|רהיטים/.test(text)) {
    features.furnished = true;
  }

  // Accessible
  if (/נגיש|נגישות|accessible|wheelchair/.test(text)) {
    features.accessible = true;
  }

  // Pets allowed
  if (/חיות מחמד|בעלי חיים|pets?.?allowed|pets?.?friendly|מותר חיות/.test(text)) {
    features.pets = true;
  }

  return features;
}
