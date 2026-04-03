const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GRAPH_API = 'https://graph.facebook.com/v21.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const META_APP_ID = Deno.env.get('META_APP_ID');
    const META_APP_SECRET = Deno.env.get('META_APP_SECRET');

    if (!META_APP_ID || !META_APP_SECRET) {
      return new Response(JSON.stringify({ success: false, error: 'META_APP_ID/META_APP_SECRET not configured' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { access_token, page_id, ig_user_id } = await req.json();

    if (!access_token || !page_id) {
      return new Response(JSON.stringify({ success: false, error: 'access_token and page_id are required' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const appAccessToken = `${META_APP_ID}|${META_APP_SECRET}`;

    // Step 1: Debug the input token to determine type
    console.log('Step 1: Debugging input token...');
    const debugRes = await fetch(`${GRAPH_API}/debug_token?input_token=${access_token}&access_token=${appAccessToken}`);
    const debugData = await debugRes.json();

    if (debugData.data?.error) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `טוקן לא תקין: ${debugData.data.error.message}`,
        error_code: 'invalid_token'
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokenType = debugData.data?.type; // USER or PAGE
    const isValid = debugData.data?.is_valid;
    console.log(`Token type: ${tokenType}, valid: ${isValid}`);

    if (!isValid) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'הטוקן אינו תקף. אנא צור טוקן חדש.',
        error_code: 'token_invalid'
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let finalPageToken = access_token;

    if (tokenType === 'USER') {
      // Step 2: Exchange short-lived USER token for long-lived USER token
      console.log('Step 2: Exchanging for long-lived user token...');
      const exchangeRes = await fetch(
        `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${access_token}`
      );
      const exchangeData = await exchangeRes.json();

      if (exchangeData.error) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `שגיאה בהמרת טוקן: ${exchangeData.error.message}`,
          error_code: 'exchange_failed'
        }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const longLivedUserToken = exchangeData.access_token;
      console.log('Got long-lived user token');

      // Step 3: Get Page Access Token from long-lived user token
      console.log('Step 3: Getting page token...');
      const pageTokenRes = await fetch(
        `${GRAPH_API}/${page_id}?fields=access_token,name,id&access_token=${longLivedUserToken}`
      );
      const pageTokenData = await pageTokenRes.json();

      if (pageTokenData.error || !pageTokenData.access_token) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: pageTokenData.error?.message || 'לא התקבל Page Token. ודא שיש לך הרשאת pages_manage_posts',
          error_code: 'page_token_failed'
        }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      finalPageToken = pageTokenData.access_token;
      console.log(`Got page token for: ${pageTokenData.name}`);
    }

    // Step 4: Verify the final Page Token works
    console.log('Step 4: Verifying page token...');
    const verifyRes = await fetch(`${GRAPH_API}/${page_id}?fields=name,id&access_token=${finalPageToken}`);
    const verifyData = await verifyRes.json();

    if (verifyData.error) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `טוקן הדף לא תקין: ${verifyData.error.message}`,
        error_code: 'page_verify_failed'
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 5: Debug the final page token with App Access Token for accurate expiry
    console.log('Step 5: Getting accurate expiry info...');
    const finalDebugRes = await fetch(`${GRAPH_API}/debug_token?input_token=${finalPageToken}&access_token=${appAccessToken}`);
    const finalDebugData = await finalDebugRes.json();

    const expiresAt = finalDebugData.data?.expires_at; // 0 means never expires
    const isPermanent = expiresAt === 0;
    let tokenExpiresAt: string | null = null;

    if (isPermanent) {
      // Page tokens from long-lived user tokens don't expire
      tokenExpiresAt = null;
      console.log('Token is permanent (never expires)');
    } else if (expiresAt && expiresAt > 0) {
      tokenExpiresAt = new Date(expiresAt * 1000).toISOString();
      console.log(`Token expires at: ${tokenExpiresAt}`);
    }

    // Step 6: Check IG user ID if provided
    let verifiedIgUserId = ig_user_id || null;
    if (verifiedIgUserId) {
      const igRes = await fetch(`${GRAPH_API}/${verifiedIgUserId}?fields=id,username&access_token=${finalPageToken}`);
      const igData = await igRes.json();
      if (igData.error) {
        console.log(`IG verification failed: ${igData.error.message}`);
        verifiedIgUserId = null; // Don't block, just warn
      } else {
        console.log(`IG account verified: ${igData.username || igData.id}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      page_name: verifyData.name,
      page_id: verifyData.id,
      page_access_token: finalPageToken,
      token_expires_at: tokenExpiresAt,
      is_permanent: isPermanent,
      ig_user_id: verifiedIgUserId,
      token_type: tokenType,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('verify-meta-connection error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
