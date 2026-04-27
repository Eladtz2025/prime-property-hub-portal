/**
 * Cloudflare Worker — Multi-target proxy for property scraping.
 *
 * Targets supported:
 *   - yad2  (default, backwards compatible)
 *   - madlan
 *
 * Why this exists:
 *   Supabase Edge Function IPs are blocked by Cloudflare on yad2.co.il and madlan.co.il.
 *   This Worker runs on Cloudflare's network, so requests originate from a different IP
 *   reputation pool — bypassing the block without any third-party paid service.
 *
 * Security:
 *   Requests must include the `x-proxy-key` header matching the YAD2_PROXY_KEY secret
 *   configured in this Worker's environment variables.
 *
 * Request body (POST JSON):
 *   {
 *     "url": "https://www.madlan.co.il/...",
 *     "target": "madlan" | "yad2",        // optional, auto-detected from URL if omitted
 *     "headers": { ... }                    // optional, overrides default headers per-target
 *   }
 *
 * Response (JSON):
 *   { "status": <upstream HTTP status>, "html": "<response body>" }
 *
 * Deploy:
 *   1. Cloudflare Dashboard → Workers & Pages → your worker → Quick Edit
 *   2. Paste this entire file, Save & Deploy
 *   3. Ensure secret YAD2_PROXY_KEY is set under Settings → Variables
 */

const TARGET_DEFAULTS = {
  yad2: {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
  },
  madlan: {
    // Minimal Next.js bypass headers — proven to work on detail pages (88% success).
    // Do NOT add User-Agent/Referer/Origin — they trigger Madlan's CF challenge.
    'Accept': 'text/html',
    'X-Nextjs-Data': '1',
    'Accept-Language': 'he-IL,he;q=0.9',
  },
};

function detectTarget(url) {
  const lower = url.toLowerCase();
  if (lower.includes('madlan.co.il')) return 'madlan';
  if (lower.includes('yad2.co.il')) return 'yad2';
  return 'yad2'; // default
}

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'content-type, x-proxy-key',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Auth check
    const proxyKey = request.headers.get('x-proxy-key');
    if (!proxyKey || proxyKey !== env.YAD2_PROXY_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (_) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetUrl = body.url;
    if (!targetUrl || typeof targetUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid "url" field' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Allowlist domains
    const allowedHosts = ['yad2.co.il', 'madlan.co.il'];
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (_) {
      return new Response(JSON.stringify({ error: 'Malformed URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!allowedHosts.some((h) => parsedUrl.hostname.endsWith(h))) {
      return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const target = body.target || detectTarget(targetUrl);
    const defaultHeaders = TARGET_DEFAULTS[target] || TARGET_DEFAULTS.yad2;
    const customHeaders = body.headers && typeof body.headers === 'object' ? body.headers : {};
    const finalHeaders = { ...defaultHeaders, ...customHeaders };

    try {
      const upstream = await fetch(targetUrl, {
        method: 'GET',
        headers: finalHeaders,
        // Cloudflare-specific: set cf options to avoid caching scrape responses
        cf: { cacheTtl: 0, cacheEverything: false },
      });

      const html = await upstream.text();

      return new Response(JSON.stringify({
        status: upstream.status,
        html,
        target,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Upstream fetch failed',
        message: error?.message || String(error),
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
