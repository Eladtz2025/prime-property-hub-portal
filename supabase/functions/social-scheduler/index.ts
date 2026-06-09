import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { getRestrictedCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';
import { hasCronSecret, isInternalCall, unauthorized } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  const corsHeaders = getRestrictedCorsHeaders(req);
  const optionsResponse = handleCorsOptions(req);
  if (optionsResponse) return optionsResponse;

  // AUTHZ: this is a cron-only endpoint. Require the CRON_SECRET (or an internal
  // service-role call). Reject anonymous callers holding only the public anon key.
  if (!hasCronSecret(req) && !isInternalCall(req)) {
    return unauthorized(corsHeaders);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find posts ready to publish
    const { data: posts, error } = await supabase
      .from('social_posts')
      .select('id')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching scheduled posts:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!posts || posts.length === 0) {
      return new Response(JSON.stringify({ message: 'No posts to publish', count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: { post_id: string; success: boolean; error?: string }[] = [];

    for (const post of posts) {
      // Mark as publishing to prevent double-processing
      await supabase.from('social_posts').update({ status: 'publishing' }).eq('id', post.id);

      try {
        const publishUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/social-publish`;
        const res = await fetch(publishUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ post_id: post.id }),
        });

        const data = await res.json();
        results.push({ post_id: post.id, success: data.success !== false });
      } catch (e) {
        console.error(`Failed to publish post ${post.id}:`, e);
        await supabase.from('social_posts').update({
          status: 'failed',
          error_message: e instanceof Error ? e.message : 'Scheduler error',
          retry_count: 3,
        }).eq('id', post.id);
        results.push({ post_id: post.id, success: false, error: e instanceof Error ? e.message : 'Unknown' });
      }
    }

    // Check for tokens expiring in 7 days
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expiringAccounts } = await supabase
      .from('social_accounts')
      .select('id, page_name, token_expires_at')
      .eq('is_active', true)
      .lte('token_expires_at', sevenDaysFromNow);

    return new Response(JSON.stringify({
      published: results.length,
      results,
      expiring_tokens: expiringAccounts?.length || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('social-scheduler error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
