import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

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

// Build a Supabase Storage transform URL for consistent 1200x630 OG images
const buildOgImageUrl = (originalUrl: string): string => {
  // Supabase storage URLs support /render/image/ transforms
  // Convert: .../storage/v1/object/public/bucket/path
  // To:      .../storage/v1/render/image/public/bucket/path?width=1200&height=630&resize=cover
  if (originalUrl.includes('/storage/v1/object/public/')) {
    return originalUrl.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    ) + '?width=1200&height=630&resize=cover';
  }
  // For non-Supabase URLs, return as-is
  return originalUrl;
};

const getPropertyTypePrefix = (propertyType: string | null, isEn: boolean): string => {
  const prefixes: Record<string, { he: string; en: string }> = {
    rental: { he: 'להשכרה', en: 'For Rent' },
    sale: { he: 'למכירה', en: 'For Sale' },
    management: { he: 'ניהול', en: 'Management' }
  };
  const prefix = prefixes[propertyType || 'rental'] || prefixes.rental;
  return isEn ? prefix.en : prefix.he;
};

const buildDescription = (property: any, isEnglish: boolean, location: string): string => {
  const parts: string[] = [];
  
  if (property.rooms) {
    parts.push(isEnglish ? `${property.rooms} rooms` : `${property.rooms} חד'`);
  }
  if (property.property_size) {
    parts.push(isEnglish ? `${property.property_size} sqm` : `${property.property_size} מ"ר`);
  }
  if (property.floor !== null && property.floor !== undefined) {
    parts.push(isEnglish ? `Floor ${property.floor}` : `קומה ${property.floor}`);
  }
  if (property.balcony === true) {
    parts.push(isEnglish ? `Balcony` : `מרפסת`);
  }
  if (property.parking === true) {
    parts.push(isEnglish ? `Parking` : `חניה`);
  }
  if (property.elevator === true) {
    parts.push(isEnglish ? `Elevator` : `מעלית`);
  }
  if (property.monthly_rent) {
    const formatted = isEnglish
      ? new Intl.NumberFormat('en-US').format(property.monthly_rent)
      : new Intl.NumberFormat('he-IL').format(property.monthly_rent);
    const suffix = property.property_type === 'sale' ? '' : (isEnglish ? '/month' : '/חודש');
    parts.push(`₪${formatted}${suffix}`);
  }
  parts.push(location);
  
  return parts.join(' | ');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('id');
    const lang = url.searchParams.get('lang') || 'he';
    const customTitle = url.searchParams.get('custom_title');
    const customDesc = url.searchParams.get('custom_desc');
    const imgIndex = url.searchParams.get('img_index'); // Selected image index from UI
    
    console.log(`OG Property request for ID: ${propertyId}, lang: ${lang}, img_index: ${imgIndex}`);

    if (!propertyId) {
      return new Response('Property ID required', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        id, title, title_en, description, description_en,
        address, city, neighborhood, neighborhood_en,
        rooms, property_size, monthly_rent, property_type,
        floor, balcony, parking, elevator, bathrooms,
        property_images ( id, image_url, is_main, order_index )
      `)
      .eq('id', propertyId)
      .single();

    if (error || !property) {
      console.error('Property not found:', error);
      return new Response('Property not found', { status: 404 });
    }

    // Sort images: main first, then by order_index
    const images = property.property_images || [];
    const sortedImages = images.sort((a: any, b: any) => {
      if (a.is_main && !b.is_main) return -1;
      if (!a.is_main && b.is_main) return 1;
      return (a.order_index || 0) - (b.order_index || 0);
    });
    
    // Use requested image index if provided, otherwise use main/first image
    const selectedIndex = imgIndex !== null ? parseInt(imgIndex, 10) : 0;
    const rawImageUrl = (sortedImages[selectedIndex] || sortedImages[0])?.image_url 
      || 'https://jswumsdymlooeobrxict.supabase.co/storage/v1/object/public/property-images/city-market-logo.png';

    // Transform to 1200x630 for consistent large Link Card on Facebook
    const ogImageUrl = buildOgImageUrl(rawImageUrl);

    const isEnglish = lang === 'en';
    const propertyTypePrefix = getPropertyTypePrefix(property.property_type, isEnglish);
    const title = isEnglish 
      ? (property.title_en || property.title || 'Property')
      : (property.title || 'נכס');
    
    const location = isEnglish
      ? (property.neighborhood_en || property.city || 'Tel Aviv')
      : (property.neighborhood || property.city || 'תל אביב');
    
    const description = buildDescription(property, isEnglish, location);

    const siteName = isEnglish ? 'City Market Real Estate' : 'סיטי מרקט נדל"ן';
    const baseUrl = 'https://www.ctmarketproperties.com';
    const propertyUrl = isEnglish 
      ? `${baseUrl}/en/property/${propertyId}`
      : `${baseUrl}/property/${propertyId}`;

    

    const fullTitle = `${propertyTypePrefix}: ${title}`;
    const finalTitle = customTitle || fullTitle;
    const finalDesc = customDesc || description;

    const escapedDescription = escapeHtml(finalDesc.substring(0, 200));
    const escapedTitle = escapeHtml(finalTitle);
    const escapedSiteName = escapeHtml(siteName);

    console.log(`OG image URL (transformed): ${ogImageUrl}`);

    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${isEnglish ? 'ltr' : 'rtl'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <title>${escapedTitle} | ${escapedSiteName}</title>
  <meta name="title" content="${escapedTitle} | ${escapedSiteName}">
  <meta name="description" content="${escapedDescription}">
  
  <meta property="og:type" content="website">
  <meta property="og:url" content="${propertyUrl}">
  <meta property="og:title" content="${escapedTitle}">
  <meta property="og:description" content="${escapedDescription}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:alt" content="${escapedTitle}">
  <meta property="og:site_name" content="City Market">
  <meta property="og:locale" content="${isEnglish ? 'en_US' : 'he_IL'}">
  
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${propertyUrl}">
  <meta property="twitter:title" content="${escapedTitle}">
  <meta property="twitter:description" content="${escapedDescription}">
  <meta property="twitter:image" content="${ogImageUrl}">
  
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

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
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
