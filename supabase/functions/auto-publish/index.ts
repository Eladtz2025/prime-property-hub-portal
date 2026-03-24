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
        // Check frequency_days — skip if not enough days passed
        const freqDays = queue.frequency_days || 1;
        if (queue.last_published_at && freqDays > 1) {
          const lastPub = new Date(queue.last_published_at);
          const daysSince = (Date.now() - lastPub.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince < freqDays - 0.5) {
            results.push({ queue: queue.name, skipped: true, reason: `Only ${daysSince.toFixed(1)} days since last publish, need ${freqDays}` });
            continue;
          }
        }

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
  const propertyFilter = (queue.property_filter as string) || 'all';
  let q = supabase
    .from('properties')
    .select('id, address, city, neighborhood, rooms, property_size, floor, property_type, monthly_rent, description')
    .eq('show_on_website', true)
    .eq('status', 'vacant');
  
  if (propertyFilter === 'rental') q = q.eq('property_type', 'rental');
  else if (propertyFilter === 'sale') q = q.eq('property_type', 'sale');

  const { data: properties, error: pErr } = await q.order('created_at', { ascending: true });

  if (pErr) throw pErr;
  if (!properties || properties.length === 0) {
    return { skipped: true, reason: 'No active properties' };
  }

  let currentIndex = (queue.current_index as number) || 0;
  if (currentIndex >= properties.length) currentIndex = 0;

  const property = properties[currentIndex];

  const { data: images } = await supabase
    .from('property_images')
    .select('image_url')
    .eq('property_id', property.id)
    .eq('show_on_website', true)
    .order('order_index', { ascending: true })
    .limit(10);

  const imageUrls = images?.map((img: { image_url: string }) => img.image_url) || [];

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
  const publishTarget = (queue.publish_target as { type: string; group_ids?: string[] }) || { type: 'page' };
  // Determine effective platforms — if target is groups, use facebook_group platform
  const effectivePlatforms: { platform: string; group_id?: string }[] = [];
  for (const platform of platforms) {
    if (platform === 'facebook_page' && publishTarget.type === 'groups' && publishTarget.group_ids?.length) {
      for (const groupId of publishTarget.group_ids) {
        effectivePlatforms.push({ platform: 'facebook_group', group_id: groupId });
      }
    } else {
      effectivePlatforms.push({ platform });
    }
  }

  for (const { platform, group_id } of effectivePlatforms) {
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
        ...(group_id ? { target_group_id: group_id } : {}),
      })
      .select()
      .single();

    if (postErr) throw postErr;

    const { data: publishResult, error: publishErr } = await supabase.functions.invoke('social-publish', {
      body: { post_id: post.id },
    });

    await supabase.from('auto_publish_log').insert({
      queue_id: queue.id,
      property_id: property.id,
      social_post_id: post.id,
      platforms: [platform],
      status: publishErr ? 'failed' : 'published',
      error_message: publishErr?.message || publishResult?.error || null,
    });
  }

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
  const now = new Date();
  const israelDay = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  const todayDow = israelDay.getDay();

  const nextPublishDay = queue.next_publish_day as number | null;

  if (nextPublishDay === null || nextPublishDay === undefined) {
    const randomDay = Math.floor(Math.random() * 5) + 1;
    await supabase
      .from('auto_publish_queues')
      .update({ next_publish_day: randomDay })
      .eq('id', queue.id);
    return { skipped: true, reason: `Random day set to ${randomDay}, waiting` };
  }

  if (todayDow !== nextPublishDay) {
    return { skipped: true, reason: `Today is ${todayDow}, publish day is ${nextPublishDay}` };
  }

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

  const { data: items, error: iErr } = await supabase
    .from('auto_publish_items')
    .select('*')
    .eq('queue_id', queue.id)
    .eq('is_published', false)
    .order('order_index', { ascending: true })
    .limit(1);

  if (iErr) throw iErr;
  if (!items || items.length === 0) {
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

  await supabase
    .from('auto_publish_items')
    .update({ is_published: true, published_at: new Date().toISOString() })
    .eq('id', article.id);

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
