import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

// Escape HTML special characters to prevent breaking meta tag attributes
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('id');
    const lang = url.searchParams.get('lang') || 'he';
    
    console.log(`OG Property request for ID: ${propertyId}, lang: ${lang}`);

    if (!propertyId) {
      return new Response('Property ID required', { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch property with main image
    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        id,
        title,
        title_en,
        description,
        description_en,
        address,
        city,
        neighborhood,
        neighborhood_en,
        rooms,
        property_size,
        monthly_rent,
        property_type,
        floor,
        balcony,
        parking,
        elevator,
        bathrooms,
        property_images (
          id,
          image_url,
          is_main,
          order_index
        )
      `)
      .eq('id', propertyId)
      .single();

    if (error || !property) {
      console.error('Property not found:', error);
      return new Response('Property not found', { status: 404 });
    }

    // Get the main image or first image
    const images = property.property_images || [];
    const sortedImages = images.sort((a: any, b: any) => {
      if (a.is_main && !b.is_main) return -1;
      if (!a.is_main && b.is_main) return 1;
      return (a.order_index || 0) - (b.order_index || 0);
    });
    
    const mainImage = sortedImages[0]?.image_url || 'https://jswumsdymlooeobrxict.supabase.co/storage/v1/object/public/property-images/city-market-logo.png';

    // Get property type prefix
    const getPropertyTypePrefix = (propertyType: string | null, isEn: boolean): string => {
      const prefixes: Record<string, { he: string; en: string }> = {
        rental: { he: 'להשכרה', en: 'For Rent' },
        sale: { he: 'למכירה', en: 'For Sale' },
        management: { he: 'ניהול', en: 'Management' }
      };
      const prefix = prefixes[propertyType || 'rental'] || prefixes.rental;
      return isEn ? prefix.en : prefix.he;
    };

    // Prepare content based on language
    const isEnglish = lang === 'en';
    const propertyTypePrefix = getPropertyTypePrefix(property.property_type, isEnglish);
    const title = isEnglish 
      ? (property.title_en || property.title || 'Property')
      : (property.title || 'נכס');
    
    const location = isEnglish
      ? (property.neighborhood_en || property.city || 'Tel Aviv')
      : (property.neighborhood || property.city || 'תל אביב');
    
    // Build structured description with emojis for each detail
    const descPartsHe: string[] = [];
    const descPartsEn: string[] = [];
    
    if (property.rooms) {
      descPartsHe.push(`🛏️ ${property.rooms} חד'`);
      descPartsEn.push(`🛏️ ${property.rooms} rooms`);
    }
    if (property.property_size) {
      descPartsHe.push(`📐 ${property.property_size} מ"ר`);
      descPartsEn.push(`📐 ${property.property_size} sqm`);
    }
    if (property.floor !== null && property.floor !== undefined) {
      descPartsHe.push(`🏢 קומה ${property.floor}`);
      descPartsEn.push(`🏢 Floor ${property.floor}`);
    }
    if (property.balcony === true) {
      descPartsHe.push(`🌿 מרפסת`);
      descPartsEn.push(`🌿 Balcony`);
    }
    if (property.parking === true) {
      descPartsHe.push(`🚗 חניה`);
      descPartsEn.push(`🚗 Parking`);
    }
    if (property.elevator === true) {
      descPartsHe.push(`🛗 מעלית`);
      descPartsEn.push(`🛗 Elevator`);
    }
    
    // Format price with emoji
    if (property.monthly_rent) {
      const priceHe = `💰 ₪${new Intl.NumberFormat('he-IL').format(property.monthly_rent)}${property.property_type === 'sale' ? '' : '/חודש'}`;
      const priceEn = `💰 ₪${new Intl.NumberFormat('en-US').format(property.monthly_rent)}${property.property_type === 'sale' ? '' : '/month'}`;
      descPartsHe.push(priceHe);
      descPartsEn.push(priceEn);
    }
    
    // Add location with emoji
    descPartsHe.push(`📍 ${location}`);
    descPartsEn.push(`📍 ${location}`);
    
    // Build structured description with pipe separator
    const description = isEnglish
      ? descPartsEn.join(' | ')
      : descPartsHe.join(' | ');

    // Detailed logging for debugging
    console.log(`Property details - rooms: ${property.rooms}, size: ${property.property_size}, floor: ${property.floor}, balcony: ${property.balcony}, parking: ${property.parking}, elevator: ${property.elevator}, rent: ${property.monthly_rent}`);
    console.log(`Generated description (${isEnglish ? 'EN' : 'HE'}): ${description}`);

    const siteName = isEnglish ? 'City Market Real Estate' : 'סיטי מרקט נדל"ן';
    
    // Build the actual page URL for redirect
    const baseUrl = 'https://citymarket.co.il';
    const propertyUrl = isEnglish 
      ? `${baseUrl}/en/property/${propertyId}`
      : `${baseUrl}/property/${propertyId}`;

    const fullTitle = `${propertyTypePrefix}: ${title}`;

    // Dynamic OG image URL - generates branded 1200x630 image
    const ogImageUrl = `https://jswumsdymlooeobrxict.supabase.co/functions/v1/og-image?id=${propertyId}&lang=${lang}`;

    // Escape content for safe HTML attribute embedding
    const escapedDescription = escapeHtml(description.substring(0, 200));
    const escapedTitle = escapeHtml(fullTitle);
    const escapedSiteName = escapeHtml(siteName);

    // Generate HTML with OG tags
    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${isEnglish ? 'ltr' : 'rtl'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${escapedTitle} | ${escapedSiteName}</title>
  <meta name="title" content="${escapedTitle} | ${escapedSiteName}">
  <meta name="description" content="${escapedDescription}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${propertyUrl}">
  <meta property="og:title" content="${escapedTitle}">
  <meta property="og:description" content="${escapedDescription}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/svg+xml">
  <meta property="og:image:alt" content="${escapedTitle}">
  <meta property="og:site_name" content="${escapedSiteName}">
  <meta property="og:locale" content="${isEnglish ? 'en_US' : 'he_IL'}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${propertyUrl}">
  <meta property="twitter:title" content="${escapedTitle}">
  <meta property="twitter:description" content="${escapedDescription}">
  <meta property="twitter:image" content="${ogImageUrl}">
  
  <!-- Fallback image for crawlers that don't support SVG -->
  <meta property="og:image" content="${mainImage}">
  
  <!-- Redirect for regular users (bots don't execute JS) -->
  <script>
    window.location.href = "${propertyUrl}";
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${propertyUrl}">
  </noscript>
</head>
<body>
  <p>Redirecting to <a href="${propertyUrl}">${escapedTitle}</a>...</p>
</body>
</html>`;

    console.log(`Generated OG HTML for property ${propertyId}, image: ${mainImage}`);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error in og-property function:', error);
    return new Response(`Error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
