import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { getRestrictedCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';

const GRAPH_API = 'https://graph.facebook.com/v21.0';

interface PublishResult {
  success: boolean;
  external_post_id?: string;
  external_post_url?: string;
  error?: string;
}

async function publishToFacebookPage(
  pageId: string,
  accessToken: string,
  text: string,
  imageUrls: string[],
  videoUrl?: string,
  linkUrl?: string,
  isPrivate?: boolean
): Promise<PublishResult> {
  try {
    const privacyParam = isPrivate ? { privacy: { value: 'SELF' } } : {};
    // Video post
    if (videoUrl) {
      const res = await fetch(`${GRAPH_API}/${pageId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: videoUrl,
          description: text,
          access_token: accessToken,
        }),
      });
      const data = await res.json();
      if (data.error) return { success: false, error: data.error.message };
      return { success: true, external_post_id: data.id, external_post_url: `https://facebook.com/${data.id}` };
    }

    // Link post — Facebook generates OG card automatically
    if (linkUrl && (!imageUrls || imageUrls.length === 0)) {
      const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, link: linkUrl, access_token: accessToken, ...privacyParam }),
      });
      const data = await res.json();
      if (data.error) return { success: false, error: data.error.message };
      return { success: true, external_post_id: data.id, external_post_url: `https://facebook.com/${data.id}` };
    }

    // Text only (no images, no link)
    if (!imageUrls || imageUrls.length === 0) {
      const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, access_token: accessToken, ...privacyParam }),
      });
      const data = await res.json();
      if (data.error) return { success: false, error: data.error.message };
      return { success: true, external_post_id: data.id, external_post_url: `https://facebook.com/${data.id}` };
    }

    // Single image
    if (imageUrls.length === 1) {
      const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrls[0], message: text, access_token: accessToken, ...privacyParam }),
      });
      const data = await res.json();
      if (data.error) return { success: false, error: data.error.message };
      return { success: true, external_post_id: data.id, external_post_url: `https://facebook.com/${data.id}` };
    }

    // Multiple images — upload unpublished then create feed post with attached_media
    const photoIds: string[] = [];
    for (const url of imageUrls) {
      const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, published: false, access_token: accessToken }),
      });
      const data = await res.json();
      if (data.error) return { success: false, error: data.error.message };
      photoIds.push(data.id);
    }

    const attachedMedia: Record<string, string> = {};
    photoIds.forEach((id, i) => {
      attachedMedia[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
    });

    const params = new URLSearchParams({ message: text, access_token: accessToken, ...(isPrivate ? { privacy: JSON.stringify({ value: 'SELF' }) } : {}) });
    photoIds.forEach((id, i) => {
      params.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: id }));
    });

    const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await res.json();
    if (data.error) return { success: false, error: data.error.message };
    return { success: true, external_post_id: data.id, external_post_url: `https://facebook.com/${data.id}` };

  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

async function publishToInstagram(
  igUserId: string,
  accessToken: string,
  caption: string,
  imageUrls: string[],
  videoUrl?: string
): Promise<PublishResult> {
  try {
    // Reel
    if (videoUrl) {
      const createRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'REELS',
          video_url: videoUrl,
          caption,
          access_token: accessToken,
        }),
      });
      const createData = await createRes.json();
      if (createData.error) return { success: false, error: createData.error.message };

      // Poll for processing completion instead of fixed wait
      const containerId = createData.id;
      let processingDone = false;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetch(`${GRAPH_API}/${containerId}?fields=status_code&access_token=${accessToken}`);
        const statusData = await statusRes.json();
        if (statusData.status_code === 'FINISHED') {
          processingDone = true;
          break;
        }
        if (statusData.status_code === 'ERROR') {
          return { success: false, error: 'Instagram video processing failed' };
        }
      }
      if (!processingDone) {
        return { success: false, error: 'Instagram video processing timeout (60s)' };
      }

      const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: createData.id, access_token: accessToken }),
      });
      const publishData = await publishRes.json();
      if (publishData.error) return { success: false, error: publishData.error.message };
      return { success: true, external_post_id: publishData.id, external_post_url: `https://instagram.com/p/${publishData.id}` };
    }

    // Single image
    if (imageUrls.length === 1) {
      const createRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrls[0], caption, access_token: accessToken }),
      });
      const createData = await createRes.json();
      if (createData.error) return { success: false, error: createData.error.message };

      const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: createData.id, access_token: accessToken }),
      });
      const publishData = await publishRes.json();
      if (publishData.error) return { success: false, error: publishData.error.message };
      return { success: true, external_post_id: publishData.id };
    }

    // Carousel (multiple images, max 10)
    const childrenIds: string[] = [];
    for (const url of imageUrls.slice(0, 10)) {
      const res = await fetch(`${GRAPH_API}/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: accessToken }),
      });
      const data = await res.json();
      if (data.error) return { success: false, error: data.error.message };
      childrenIds.push(data.id);
    }

    const carouselRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: childrenIds,
        caption,
        access_token: accessToken,
      }),
    });
    const carouselData = await carouselRes.json();
    if (carouselData.error) return { success: false, error: carouselData.error.message };

    const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: carouselData.id, access_token: accessToken }),
    });
    const publishData = await publishRes.json();
    if (publishData.error) return { success: false, error: publishData.error.message };
    return { success: true, external_post_id: publishData.id };

  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getRestrictedCorsHeaders(req);
  const optionsResponse = handleCorsOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { post_id, is_private } = await req.json();
    if (!post_id) {
      return new Response(JSON.stringify({ error: 'post_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the post
    const { data: post, error: postErr } = await supabase
      .from('social_posts')
      .select('*')
      .eq('id', post_id)
      .single();

    if (postErr || !post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to publishing
    await supabase.from('social_posts').update({ status: 'publishing' }).eq('id', post_id);

    // Facebook group posts are semi-automatic — just mark as ready
    if (post.platform === 'facebook_group') {
      await supabase.from('social_posts').update({
        status: 'ready_to_copy',
        published_at: new Date().toISOString(),
      }).eq('id', post_id);

      return new Response(JSON.stringify({
        success: true,
        message: 'Group post prepared — copy text and open group manually',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch account
    const platform = post.platform === 'facebook_page' ? 'facebook' : 'instagram';
    const { data: account } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', platform)
      .eq('is_active', true)
      .single();

    if (!account || !account.access_token) {
      await supabase.from('social_posts').update({
        status: 'failed',
        error_message: 'No active social account found. Please connect your Meta account.',
      }).eq('id', post_id);

      return new Response(JSON.stringify({ success: false, error: 'אין חשבון Meta מחובר. יש לחבר חשבון בהגדרות.', error_code: 'no_account' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check token expiry
    if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
      await supabase.from('social_posts').update({
        status: 'failed',
        error_message: 'Access token expired. Please refresh your Meta token.',
      }).eq('id', post_id);

      return new Response(JSON.stringify({ success: false, error: 'הטוקן פג תוקף. יש לחדש את הטוקן בהגדרות.', error_code: 'token_expired' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fullText = post.hashtags
      ? `${post.content_text || ''}\n\n${post.hashtags}`
      : (post.content_text || '');
    const rawImageUrls = (post.image_urls as string[]) || [];

    // Filter out video files from image URLs — Facebook /photos endpoint rejects them
    const videoExtensions = /\.(mov|mp4|avi|webm|mkv)$/i;
    const imageUrls = rawImageUrls.filter(url => !videoExtensions.test(url));
    const videoFromImages = rawImageUrls.find(url => videoExtensions.test(url));

    // Use explicit video_url, or fall back to video found in image_urls
    const effectiveVideoUrl = post.video_url || (imageUrls.length === 0 ? videoFromImages : undefined);

    let result: PublishResult;

    if (post.platform === 'facebook_page') {
      result = await publishToFacebookPage(
        account.page_id!,
        account.access_token,
        fullText,
        imageUrls,
        effectiveVideoUrl,
        post.link_url,
        is_private
      );
    } else {
      // Instagram
      if (!account.ig_user_id) {
        await supabase.from('social_posts').update({
          status: 'failed',
          error_message: 'Instagram Business Account ID not configured.',
        }).eq('id', post_id);
        return new Response(JSON.stringify({ success: false, error: 'חסר Instagram Business Account ID. יש להגדיר בהגדרות.', error_code: 'ig_missing' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      result = await publishToInstagram(
        account.ig_user_id,
        account.access_token,
        fullText,
        imageUrls,
        effectiveVideoUrl
      );
    }

    if (result.success) {
      await supabase.from('social_posts').update({
        status: 'published',
        published_at: new Date().toISOString(),
        external_post_id: result.external_post_id,
        external_post_url: result.external_post_url,
        error_message: null,
      }).eq('id', post_id);
    } else {
      // If token expired, deactivate the account so status reflects reality
      const errorMsg = result.error || '';
      if (errorMsg.includes('expired') || errorMsg.includes('validating access token') || errorMsg.includes('Session has expired')) {
        await supabase.from('social_accounts')
          .update({ is_active: false })
          .eq('id', account.id);
        console.log(`Deactivated account ${account.id} due to expired token`);
      }

      const newRetry = (post.retry_count || 0) + 1;
      await supabase.from('social_posts').update({
        status: newRetry >= 3 ? 'failed' : 'scheduled',
        error_message: result.error,
        retry_count: newRetry,
        // If retrying, schedule for 5 min later
        ...(newRetry < 3 ? { scheduled_at: new Date(Date.now() + newRetry * 5 * 60000).toISOString() } : {}),
      }).eq('id', post_id);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('social-publish error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
