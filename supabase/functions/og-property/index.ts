import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

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
    
    // Build structured description with property details
    const detailsHe: string[] = [];
    const detailsEn: string[] = [];
    
    if (property.rooms) {
      detailsHe.push(`${property.rooms} חדרים`);
      detailsEn.push(`${property.rooms} rooms`);
    }
    if (property.property_size) {
      detailsHe.push(`${property.property_size} מ"ר`);
      detailsEn.push(`${property.property_size} sqm`);
    }
    if (property.floor) {
      detailsHe.push(`קומה ${property.floor}`);
      detailsEn.push(`Floor ${property.floor}`);
    }
    if (property.balcony) {
      detailsHe.push('מרפסת ✓');
      detailsEn.push('Balcony ✓');
    }
    if (property.parking) {
      detailsHe.push('חניה ✓');
      detailsEn.push('Parking ✓');
    }
    if (property.elevator) {
      detailsHe.push('מעלית ✓');
      detailsEn.push('Elevator ✓');
    }
    
    // Format price
    const priceFormatted = property.monthly_rent 
      ? `₪${new Intl.NumberFormat('he-IL').format(property.monthly_rent)}${property.property_type === 'sale' ? '' : '/חודש'}`
      : '';
    const priceFormattedEn = property.monthly_rent 
      ? `₪${new Intl.NumberFormat('en-US').format(property.monthly_rent)}${property.property_type === 'sale' ? '' : '/month'}`
      : '';
    
    // Build structured description
    const description = isEnglish
      ? `🏠 ${detailsEn.join(' • ')}${priceFormattedEn ? ` | ${priceFormattedEn}` : ''} | ${location}`
      : `🏠 ${detailsHe.join(' • ')}${priceFormatted ? ` | ${priceFormatted}` : ''} | ${location}`;

    const siteName = isEnglish ? 'City Market Real Estate' : 'סיטי מרקט נדל"ן';
    
    // Build the actual page URL for redirect
    const baseUrl = 'https://citymarket.co.il';
    const propertyUrl = isEnglish 
      ? `${baseUrl}/en/property/${propertyId}`
      : `${baseUrl}/property/${propertyId}`;

    const fullTitle = `${propertyTypePrefix}: ${title}`;

    // Dynamic OG image URL - generates branded 1200x630 image
    const ogImageUrl = `https://jswumsdymlooeobrxict.supabase.co/functions/v1/og-image?id=${propertyId}&lang=${lang}`;

    // Generate HTML with OG tags
    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${isEnglish ? 'ltr' : 'rtl'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${fullTitle} | ${siteName}</title>
  <meta name="title" content="${fullTitle} | ${siteName}">
  <meta name="description" content="${description.substring(0, 160)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${propertyUrl}">
  <meta property="og:title" content="${fullTitle}">
  <meta property="og:description" content="${description.substring(0, 160)}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/svg+xml">
  <meta property="og:image:alt" content="${fullTitle}">
  <meta property="og:site_name" content="${siteName}">
  <meta property="og:locale" content="${isEnglish ? 'en_US' : 'he_IL'}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${propertyUrl}">
  <meta property="twitter:title" content="${fullTitle}">
  <meta property="twitter:description" content="${description.substring(0, 160)}">
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
  <p>Redirecting to <a href="${propertyUrl}">${fullTitle}</a>...</p>
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
