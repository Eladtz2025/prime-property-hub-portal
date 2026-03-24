import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Get all active queues
    const { data: queues, error: qErr } = await supabase
      .from('auto_publish_queues')
      .select('*')
      .eq('is_active', true);

    if (qErr) throw qErr;
    if (!queues || queues.length === 0) {
      return new Response(JSON.stringify({ message: 'No active queues' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Record<string, unknown>[] = [];

    for (const queue of queues) {
      try {
        if (queue.queue_type === 'property_rotation') {
          const result = await handlePropertyRotation(supabase, queue);
          results.push({ queue: queue.name, ...result });
        } else if (queue.queue_type === 'article_oneshot') {
          const result = await handleArticleOneshot(supabase, queue);
          results.push({ queue: queue.name, ...result });
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : 'Unknown error';
        console.error(`Queue ${queue.name} error:`, errMsg);
        results.push({ queue: queue.name, error: errMsg });

        // Log error
        await supabase.from('auto_publish_log').insert({
          queue_id: queue.id,
          status: 'failed',
          error_message: errMsg,
          platforms: queue.platforms,
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('auto-publish error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handlePropertyRotation(supabase: ReturnType<typeof createClient>, queue: Record<string, unknown>) {
  // Get active properties shown on website
  const { data: properties, error: pErr } = await supabase
    .from('properties')
    .select('id, address, city, neighborhood, rooms, property_size, floor, property_type, monthly_rent, description')
    .eq('show_on_website', true)
    .eq('available', true)
    .order('created_at', { ascending: true });

  if (pErr) throw pErr;
  if (!properties || properties.length === 0) {
    return { skipped: true, reason: 'No active properties' };
  }

  // Determine current index (wrap around)
  let currentIndex = (queue.current_index as number) || 0;
  if (currentIndex >= properties.length) currentIndex = 0;

  const property = properties[currentIndex];

  // Fetch property images
  const { data: images } = await supabase
    .from('property_images')
    .select('image_url')
    .eq('property_id', property.id)
    .eq('show_on_website', true)
    .order('order_index', { ascending: true })
    .limit(10);

  const imageUrls = images?.map((img: { image_url: string }) => img.image_url) || [];

  // Build post text from template
  const templateText = (queue.template_text as string) || '{address} - {price}';
  const postText = templateText
    .replace(/{address}/g, property.address || '')
    .replace(/{city}/g, property.city || '')
    .replace(/{neighborhood}/g, property.neighborhood || '')
    .replace(/{rooms}/g, property.rooms?.toString() || '')
    .replace(/{size}/g, property.property_size?.toString() || '')
    .replace(/{floor}/g, property.floor?.toString() || '')
    .replace(/{property_type}/g, property.property_type || '')
    .replace(/{price}/g, property.monthly_rent ? `₪${Number(property.monthly_rent).toLocaleString()}` : '')
    .replace(/{description}/g, property.description || '');

  const hashtags = (queue.hashtags as string) || '';
  const platforms = (queue.platforms as string[]) || ['facebook_page'];

  // Create social_posts and publish for each platform
  for (const platform of platforms) {
    // Create social post
    const { data: post, error: postErr } = await supabase
      .from('social_posts')
      .insert({
        platform,
        post_type: 'property_listing',
        content_text: postText,
        hashtags,
        image_urls: imageUrls,
        status: 'scheduled',
        property_id: property.id,
        created_by: queue.created_by,
      })
      .select()
      .single();

    if (postErr) throw postErr;

    // Call social-publish
    const { data: publishResult, error: publishErr } = await supabase.functions.invoke('social-publish', {
      body: { post_id: post.id },
    });

    // Log
    await supabase.from('auto_publish_log').insert({
      queue_id: queue.id,
      property_id: property.id,
      social_post_id: post.id,
      platforms: [platform],
      status: publishErr ? 'failed' : 'published',
      error_message: publishErr?.message || publishResult?.error || null,
    });
  }

  // Update queue index
  const nextIndex = (currentIndex + 1) >= properties.length ? 0 : currentIndex + 1;
  await supabase
    .from('auto_publish_queues')
    .update({
      current_index: nextIndex,
      last_published_at: new Date().toISOString(),
    })
    .eq('id', queue.id);

  return {
    published: true,
    property_id: property.id,
    property_address: property.address,
    next_index: nextIndex,
    total_properties: properties.length,
  };
}

async function handleArticleOneshot(supabase: ReturnType<typeof createClient>, queue: Record<string, unknown>) {
  // Weekly queue — check if today is the publish day
  const now = new Date();
  const israelDay = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  const todayDow = israelDay.getDay(); // 0=Sun..6=Sat

  const nextPublishDay = queue.next_publish_day as number | null;

  // If no day set yet, pick a random day this week and save it
  if (nextPublishDay === null || nextPublishDay === undefined) {
    const randomDay = Math.floor(Math.random() * 5) + 1; // Mon-Fri (1-5)
    await supabase
      .from('auto_publish_queues')
      .update({ next_publish_day: randomDay })
      .eq('id', queue.id);
    return { skipped: true, reason: `Random day set to ${randomDay}, waiting` };
  }

  // Not today
  if (todayDow !== nextPublishDay) {
    return { skipped: true, reason: `Today is ${todayDow}, publish day is ${nextPublishDay}` };
  }

  // Already published today
  if (queue.last_published_at) {
    const lastPublished = new Date(queue.last_published_at as string);
    const lastPubIsrael = new Date(lastPublished.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
    if (
      lastPubIsrael.getFullYear() === israelDay.getFullYear() &&
      lastPubIsrael.getMonth() === israelDay.getMonth() &&
      lastPubIsrael.getDate() === israelDay.getDate()
    ) {
      return { skipped: true, reason: 'Already published today' };
    }
  }

  // Get next unpublished article
  const { data: items, error: iErr } = await supabase
    .from('auto_publish_items')
    .select('*')
    .eq('queue_id', queue.id)
    .eq('is_published', false)
    .order('order_index', { ascending: true })
    .limit(1);

  if (iErr) throw iErr;
  if (!items || items.length === 0) {
    // All articles published — deactivate
    await supabase
      .from('auto_publish_queues')
      .update({ is_active: false })
      .eq('id', queue.id);
    return { skipped: true, reason: 'All articles published, queue deactivated' };
  }

  const article = items[0];
  const platforms = (queue.platforms as string[]) || ['facebook_page'];
  const hashtags = (queue.hashtags as string) || '';

  for (const platform of platforms) {
    const { data: post, error: postErr } = await supabase
      .from('social_posts')
      .insert({
        platform,
        post_type: 'article',
        content_text: article.content_text + (article.link_url ? `\n\n${article.link_url}` : ''),
        hashtags,
        image_urls: article.image_urls || [],
        status: 'scheduled',
        created_by: queue.created_by,
      })
      .select()
      .single();

    if (postErr) throw postErr;

    const { data: publishResult, error: publishErr } = await supabase.functions.invoke('social-publish', {
      body: { post_id: post.id },
    });

    await supabase.from('auto_publish_log').insert({
      queue_id: queue.id,
      item_id: article.id,
      social_post_id: post.id,
      platforms: [platform],
      status: publishErr ? 'failed' : 'published',
      error_message: publishErr?.message || publishResult?.error || null,
    });
  }

  // Mark article as published
  await supabase
    .from('auto_publish_items')
    .update({ is_published: true, published_at: new Date().toISOString() })
    .eq('id', article.id);

  // Pick new random day for next week and update queue
  const nextRandomDay = Math.floor(Math.random() * 5) + 1;
  await supabase
    .from('auto_publish_queues')
    .update({
      last_published_at: new Date().toISOString(),
      next_publish_day: nextRandomDay,
    })
    .eq('id', queue.id);

  return {
    published: true,
    article_title: article.title,
    next_publish_day: nextRandomDay,
  };
}
