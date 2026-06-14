export const config = {
  runtime: 'edge',
};

// Social media bot User-Agents
const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'TelegramBot',
  'Slackbot',
  'Discordbot',
  'Pinterest',
];

function isSocialMediaBot(userAgent) {
  if (!userAgent) return false;
  return BOT_USER_AGENTS.some(bot => 
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
}

export default async function handler(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent');
  
  // Extract property ID from URL
  // Matches /property/[id] or /en/property/[id]
  const pathParts = url.pathname.split('/').filter(Boolean);
  let propertyId = null;
  let lang = 'he';
  
  if (pathParts[0] === 'property' && pathParts[1]) {
    propertyId = pathParts[1];
    lang = 'he';
  } else if (pathParts[0] === 'he' && pathParts[1] === 'property' && pathParts[2]) {
    propertyId = pathParts[2];
    lang = 'he';
  } else if (pathParts[0] === 'en' && pathParts[1] === 'property' && pathParts[2]) {
    propertyId = pathParts[2];
    lang = 'en';
  }

  // Only process if this is a property page AND from a social media bot
  if (propertyId && isSocialMediaBot(userAgent)) {
    console.log(`Bot detected: ${userAgent}, fetching OG for property ${propertyId}`);
    
    // Forward all query params (img_index, custom_title, custom_desc, v, etc.) to Supabase Edge Function
    const extraParams = new URLSearchParams(url.searchParams);
    extraParams.delete(''); // clean up
    const ogUrl = `https://jswumsdymlooeobrxict.supabase.co/functions/v1/og-property?id=${propertyId}&lang=${lang}&${extraParams.toString()}`;
    
    try {
      const response = await fetch(ogUrl);
      const html = await response.text();
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          // CRITICAL: this bot-only HTML contains a window.location.href redirect.
          // It must NEVER be stored in Vercel's shared edge cache — otherwise it gets
          // served to real browsers and creates an infinite redirect loop
          // (/he/property/:id -> /property/:id -> /he/property/:id -> ...), because
          // every property URL is rewritten back to this function in vercel.json.
          // Keep it per-request only; social platforms cache OG data on their side.
          'Cache-Control': 'private, no-store, max-age=0',
          'Vary': 'User-Agent',
        },
      });
    } catch (error) {
      console.error('Error fetching OG data:', error);
    }
  }

  // For regular users, serve the SPA shell (index.html).
  // Add Vary: User-Agent so this can never share a cache entry with the bot HTML above.
  const indexUrl = new URL('/index.html', url.origin);
  const indexResponse = await fetch(indexUrl);
  const headers = new Headers(indexResponse.headers);
  headers.set('Vary', 'User-Agent');
  return new Response(indexResponse.body, {
    status: indexResponse.status,
    statusText: indexResponse.statusText,
    headers,
  });
}
