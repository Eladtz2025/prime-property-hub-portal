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
    
    // Fetch from Supabase Edge Function
    const ogUrl = `https://jswumsdymlooeobrxict.supabase.co/functions/v1/og-property?id=${propertyId}&lang=${lang}`;
    
    try {
      const response = await fetch(ogUrl);
      const html = await response.text();
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (error) {
      console.error('Error fetching OG data:', error);
    }
  }

  // For regular users, serve the SPA
  // Fetch the main index.html
  const indexUrl = new URL('/index.html', url.origin);
  return fetch(indexUrl);
}
