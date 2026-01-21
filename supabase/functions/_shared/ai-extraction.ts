/**
 * Shared AI extraction logic for all scout functions
 * Consolidates duplicated extractPropertiesWithAI from scout-yad2, scout-madlan, scout-homeless
 */

import { cleanMarkdownContent } from "./scraping.ts";
import { detectBroker } from "./broker-detection.ts";
import { ScrapedProperty, parseHebrewDate } from "./property-helpers.ts";

// ==================== Source-Specific Prompts ====================

const SOURCE_PROMPTS: Record<string, string> = {
  yad2: `You are a real estate data extraction expert. Extract RESIDENTIAL property listings ONLY from Yad2.

PRIORITY: Focus on PRIVATE listings (פרטי) first - these are more valuable than brokerage.
- Private listings typically appear at the top of results
- Mark is_broker=true for listings from: תיווך, מתווך, משרד נדל"ן, רימקס, אנגלו סכסון, agency names

YAD2 SPECIFIC INSTRUCTIONS:
- Each property card has: price, rooms, size, floor, and address
- Look for item IDs in the listings (usually numeric)
- Extract source_id from data attributes or URL patterns
- Look for "תאריך כניסה" field - can be "כניסה מידית" (immediate) or a specific date like "01/03/2026"

CRITICAL FILTERING:
- Extract ONLY residential: apartments, penthouses, houses, garden apartments, studios
- IGNORE: offices, stores, commercial, parking, storage, pets, vehicles`,

  madlan: `You are a real estate data extraction expert. Extract RESIDENTIAL property listings ONLY from Madlan.

MADLAN SPECIFIC INSTRUCTIONS:
- Each property card contains: price in ₪ format (e.g., ‏5,300 ‏₪), rooms (חד׳), floor (קומה), size in sqm (מ"ר)
- Address format: "דירה, [street], [neighborhood]" or "פנטהאוז, [street], [neighborhood]"
- Look for property links containing: /listings/ followed by the listing ID
- Extract source_id from URL patterns like: https://www.madlan.co.il/listings/[ID]
- Ignore navigation, filters, and "דירות נוספות" recommendation sections
- Focus on the main property list
- Look for entry/availability date (תאריך כניסה) in property details

CRITICAL FILTERING:
- Extract ONLY residential: apartments, penthouses, houses, garden apartments, studios
- IGNORE: offices, stores, commercial, parking, storage, pets, vehicles`,

  homeless: `You are a real estate data extraction expert. Extract RESIDENTIAL property listings ONLY from Homeless.

HOMELESS SPECIFIC INSTRUCTIONS:
- Each property shows: rooms (חד׳), floor, size in sqm (מ"ר), and price
- Look for property links and extract IDs from URLs
- Address typically includes street and city
- Extract source_id from the URL or listing identifier
- Look for entry/availability date in property details

CRITICAL FILTERING:
- Extract ONLY residential: apartments, penthouses, houses, garden apartments, studios
- IGNORE: offices, stores, commercial, parking, storage, pets, vehicles`
};

// ==================== Main Extraction Function ====================

/**
 * Extract properties from scraped content using AI
 * @param markdown - Scraped markdown content
 * @param html - Scraped HTML content (not currently used but available)
 * @param sourceUrl - URL that was scraped
 * @param source - Source website (yad2, madlan, homeless)
 * @param propertyType - Type of property (rent or sale)
 * @param apiKey - Lovable AI API key
 * @param targetCities - Optional array of cities to filter by
 */
export async function extractPropertiesWithAI(
  markdown: string,
  html: string,
  sourceUrl: string,
  source: 'yad2' | 'madlan' | 'homeless',
  propertyType: 'rent' | 'sale',
  apiKey: string,
  targetCities?: string[]
): Promise<ScrapedProperty[]> {
  const cityFilter = targetCities?.length 
    ? `\n\nIMPORTANT: Extract ONLY properties located in these cities: ${targetCities.join(', ')}.`
    : '';

  const basePrompt = SOURCE_PROMPTS[source] || SOURCE_PROMPTS.yad2;
  
  // Add output format instructions
  const outputFormat = source === 'yad2'
    ? `Return a JSON array with: source_id, source_url, title, city, neighborhood, address, price (number), rooms (number), size (number), floor (number), entry_date, description, images, features, is_broker (boolean).`
    : `Return a JSON array with: source_id, source_url, title, city, neighborhood, address, price (number), rooms (number), size (number), floor (number), entry_date, description, images, features.`;
  
  const systemPrompt = `${basePrompt}${cityFilter}\n\n${outputFormat}\nReturn ONLY valid JSON array. If no properties found, return [].`;

  const cleanedMarkdown = cleanMarkdownContent(markdown, source);
  
  // Log input stats for debugging
  console.log(`[${source.toUpperCase()} AI] Input markdown: ${markdown.length} chars, after cleaning: ${cleanedMarkdown.length}, sending: ${Math.min(cleanedMarkdown.length, 30000)}`);

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract all property listings:\n\n${cleanedMarkdown.substring(0, 30000)}` }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('AI extraction error:', await response.text());
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const properties = JSON.parse(jsonMatch[0]);
    
    // Filter by city if specified
    const filtered = properties.filter((p: any) => {
      if (targetCities?.length && p.city) {
        const normalizedPropCity = p.city.replace(/[-–—\s]/g, '');
        return targetCities.some(tc => normalizedPropCity.includes(tc.replace(/[-–—\s]/g, '')));
      }
      return true;
    });
    
    // Log extraction stats
    if (source === 'yad2') {
      const privateCount = properties.filter((p: any) => !p.is_broker).length;
      const brokerCount = properties.filter((p: any) => p.is_broker).length;
      console.log(`[${source.toUpperCase()} AI] Extracted: ${properties.length} total (${privateCount} private, ${brokerCount} broker), after city filter: ${filtered.length}`);
    } else {
      console.log(`[${source.toUpperCase()} AI] Extracted: ${properties.length} total, after city filter: ${filtered.length}`);
    }
    
    // Map to ScrapedProperty interface
    return filtered.map((p: any) => {
      const isBroker = p.is_broker || detectBroker(p.title || '', p.description || '', p);
      let entryDate: string | null = null;
      let immediateEntry = false;
      
      if (p.entry_date) {
        const rawDate = (p.entry_date || '').toLowerCase();
        if (rawDate.includes('מיידי') || rawDate.includes('מידית')) {
          immediateEntry = true;
        } else {
          entryDate = parseHebrewDate(p.entry_date);
        }
      }
      
      return {
        source,
        source_url: p.source_url || sourceUrl,
        source_id: p.source_id || `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: p.title,
        city: p.city,
        neighborhood: p.neighborhood,
        address: p.address,
        price: p.price ? parseInt(p.price) : undefined,
        rooms: p.rooms ? parseFloat(p.rooms) : undefined,
        size: p.size ? parseInt(p.size) : undefined,
        floor: p.floor !== undefined ? parseInt(p.floor) : undefined,
        property_type: propertyType,
        description: p.description,
        images: p.images || [],
        features: {
          ...(p.features || {}),
          entry_date: entryDate,
          immediate_entry: immediateEntry
        },
        raw_data: p,
        is_private: !isBroker
      };
    });

  } catch (error) {
    console.error('AI extraction failed:', error);
    return [];
  }
}
