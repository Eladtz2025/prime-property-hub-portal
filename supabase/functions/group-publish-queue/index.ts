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

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    // GET ?action=next — return next pending post and mark as publishing
    if (req.method === 'GET' && action === 'next') {
      const now = new Date().toISOString();

      // Reset stuck "publishing" items older than 5 minutes
      await supabase
        .from('social_group_publish_queue')
        .update({ status: 'pending', attempt_count: 0 })
        .eq('status', 'publishing')
        .lt('scheduled_at', new Date(Date.now() - 5 * 60000).toISOString());

      const { data: item, error } = await supabase
        .from('social_group_publish_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', now)
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!item) {
        return new Response(JSON.stringify({ id: null, message: 'No pending items' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Mark as publishing
      await supabase
        .from('social_group_publish_queue')
        .update({ status: 'publishing' })
        .eq('id', item.id);

      return new Response(JSON.stringify({
        id: item.id,
        group_url: item.group_url,
        group_name: item.group_name,
        content_text: item.content_text,
        image_urls: item.image_urls || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET ?action=stats — return queue statistics
    if (req.method === 'GET' && action === 'stats') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: pending } = await supabase
        .from('social_group_publish_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { data: publishedToday } = await supabase
        .from('social_group_publish_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('published_at', todayStart.toISOString());

      const { data: failedToday } = await supabase
        .from('social_group_publish_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', todayStart.toISOString());

      const { data: nextItem } = await supabase
        .from('social_group_publish_queue')
        .select('scheduled_at')
        .eq('status', 'pending')
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      return new Response(JSON.stringify({
        pending: pending?.length ?? 0,
        published_today: publishedToday?.length ?? 0,
        failed_today: failedToday?.length ?? 0,
        next_scheduled_at: nextItem?.scheduled_at || null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST ?action=complete — mark as published
    if (req.method === 'POST' && action === 'complete') {
      const { id } = await req.json();
      if (!id) {
        return new Response(JSON.stringify({ error: 'id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('social_group_publish_queue')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Also update the linked social_post if all queue items for it are published
      const { data: item } = await supabase
        .from('social_group_publish_queue')
        .select('social_post_id')
        .eq('id', id)
        .single();

      if (item?.social_post_id) {
        const { data: remaining } = await supabase
          .from('social_group_publish_queue')
          .select('id')
          .eq('social_post_id', item.social_post_id)
          .neq('status', 'published')
          .limit(1);

        if (!remaining || remaining.length === 0) {
          await supabase
            .from('social_posts')
            .update({ status: 'published', published_at: new Date().toISOString() })
            .eq('id', item.social_post_id);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST ?action=fail — mark as failed
    if (req.method === 'POST' && action === 'fail') {
      const { id, error: errorMsg } = await req.json();
      if (!id) {
        return new Response(JSON.stringify({ error: 'id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get current attempt count
      const { data: current } = await supabase
        .from('social_group_publish_queue')
        .select('attempt_count')
        .eq('id', id)
        .single();

      const newAttempt = (current?.attempt_count || 0) + 1;
      // After 3 attempts, mark as failed permanently
      const newStatus = newAttempt >= 3 ? 'failed' : 'pending';

      const { error } = await supabase
        .from('social_group_publish_queue')
        .update({
          status: newStatus,
          attempt_count: newAttempt,
          error_message: errorMsg || 'Unknown error',
          // If retrying, push scheduled_at 10 minutes forward
          ...(newStatus === 'pending' ? {
            scheduled_at: new Date(Date.now() + 10 * 60000).toISOString(),
          } : {}),
        })
        .eq('id', id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, retrying: newStatus === 'pending' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: next, stats, complete, fail' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('group-publish-queue error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
