import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OG Image dimensions (1.91:1 ratio for Facebook large image)
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('id');
    const lang = url.searchParams.get('lang') || 'he';
    
    console.log(`OG Image request for property ID: ${propertyId}, lang: ${lang}`);

    if (!propertyId) {
      return new Response('Property ID required', { status: 400 });
    }

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
        neighborhood,
        neighborhood_en,
        city,
        rooms,
        property_size,
        monthly_rent,
        property_type,
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

    // Get the main image
    const images = property.property_images || [];
    const sortedImages = images.sort((a: any, b: any) => {
      if (a.is_main && !b.is_main) return -1;
      if (!a.is_main && b.is_main) return 1;
      return (a.order_index || 0) - (b.order_index || 0);
    });
    
    const mainImageUrl = sortedImages[0]?.image_url;
    const logoUrl = 'https://jswumsdymlooeobrxict.supabase.co/storage/v1/object/public/property-images/city-market-logo.png';

    // Prepare text content
    const isEnglish = lang === 'en';
    const title = isEnglish 
      ? (property.title_en || property.title || 'Property')
      : (property.title || 'נכס');
    
    const location = isEnglish
      ? (property.neighborhood_en || property.city || 'Tel Aviv')
      : (property.neighborhood || property.city || 'תל אביב');

    const propertyTypeLabels: Record<string, { he: string; en: string }> = {
      rental: { he: 'להשכרה', en: 'For Rent' },
      sale: { he: 'למכירה', en: 'For Sale' },
      management: { he: 'ניהול', en: 'Management' }
    };
    const typeLabel = propertyTypeLabels[property.property_type || 'rental'] || propertyTypeLabels.rental;
    const propertyTypeText = isEnglish ? typeLabel.en : typeLabel.he;

    // Format price
    const formatPrice = (price: number | null): string => {
      if (!price) return '';
      return new Intl.NumberFormat('he-IL').format(price);
    };
    
    const priceText = property.monthly_rent 
      ? (property.property_type === 'sale' 
          ? `₪${formatPrice(property.monthly_rent)}`
          : `₪${formatPrice(property.monthly_rent)}/${isEnglish ? 'month' : 'חודש'}`)
      : '';

    const roomsText = property.rooms 
      ? (isEnglish ? `${property.rooms} rooms` : `${property.rooms} חדרים`)
      : '';
    
    const sizeText = property.property_size 
      ? (isEnglish ? `${property.property_size} sqm` : `${property.property_size} מ"ר`)
      : '';

    const detailsText = [roomsText, sizeText].filter(Boolean).join(' • ');

    // Generate SVG with embedded image
    const svg = `
      <svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="overlay" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style="stop-color:rgba(0,0,0,0.85);stop-opacity:1" />
            <stop offset="50%" style="stop-color:rgba(0,0,0,0.4);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(0,0,0,0.1);stop-opacity:1" />
          </linearGradient>
          <clipPath id="imageClip">
            <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" rx="0" ry="0"/>
          </clipPath>
        </defs>
        
        <!-- Background color fallback -->
        <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="#1a1a2e"/>
        
        <!-- Property image as background -->
        ${mainImageUrl ? `<image href="${mainImageUrl}" x="0" y="0" width="${OG_WIDTH}" height="${OG_HEIGHT}" preserveAspectRatio="xMidYMid slice" clip-path="url(#imageClip)"/>` : ''}
        
        <!-- Gradient overlay for text readability -->
        <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#overlay)"/>
        
        <!-- Logo in top left -->
        <image href="${logoUrl}" x="40" y="30" width="140" height="60" preserveAspectRatio="xMinYMin meet"/>
        
        <!-- Property type badge -->
        <rect x="40" y="${OG_HEIGHT - 200}" width="auto" height="36" rx="18" fill="#c9a86c" opacity="0.95"/>
        <text x="60" y="${OG_HEIGHT - 176}" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1a1a2e" text-anchor="start">${propertyTypeText}</text>
        
        <!-- Title -->
        <text x="${isEnglish ? 40 : OG_WIDTH - 40}" y="${OG_HEIGHT - 120}" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="white" text-anchor="${isEnglish ? 'start' : 'end'}">${escapeXml(truncateText(title, 35))}</text>
        
        <!-- Location -->
        <text x="${isEnglish ? 40 : OG_WIDTH - 40}" y="${OG_HEIGHT - 75}" font-family="Arial, sans-serif" font-size="26" fill="#c9a86c" text-anchor="${isEnglish ? 'start' : 'end'}">${escapeXml(location)}</text>
        
        <!-- Details (rooms, size) -->
        <text x="${isEnglish ? 40 : OG_WIDTH - 40}" y="${OG_HEIGHT - 40}" font-family="Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.9)" text-anchor="${isEnglish ? 'start' : 'end'}">${escapeXml(detailsText)}</text>
        
        <!-- Price (right/left side depending on language) -->
        ${priceText ? `<text x="${isEnglish ? OG_WIDTH - 40 : 40}" y="${OG_HEIGHT - 75}" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="${isEnglish ? 'end' : 'start'}">${escapeXml(priceText)}</text>` : ''}
      </svg>
    `;

    console.log(`Generated OG SVG for property ${propertyId}`);

    // Return SVG directly (browsers and Facebook can handle SVG)
    return new Response(svg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error in og-image function:', error);
    return new Response(`Error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
