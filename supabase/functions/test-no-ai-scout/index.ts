/**
 * Test Edge Function for Non-AI Scout System
 * 
 * This function tests the experimental parsers and translation
 * WITHOUT affecting production data or code.
 * 
 * Endpoints:
 * - POST /test-no-ai-scout { mode: 'parse', source: 'homeless', html: '...' }
 * - POST /test-no-ai-scout { mode: 'translate', texts: ['...'], direction: 'he-en' }
 * - POST /test-no-ai-scout { mode: 'stats' }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Import experimental modules (completely isolated)
import { 
  translateHebrewToEnglish, 
  translateEnglishToHebrew,
  batchTranslate,
  getDictionaryStats,
  findUntranslatedWords,
  type TranslationResult 
} from '../_experimental/translate-no-ai.ts';

import {
  extractPrice,
  extractRooms,
  extractSize,
  extractFloor,
  extractCity,
  extractNeighborhood,
  detectBroker,
  cleanText,
  type ParsedProperty,
  type ParserResult
} from '../_experimental/parser-utils.ts';

import {
  parseHomelessHtml,
  parseHomelessMarkdown
} from '../_experimental/parser-homeless.ts';

import {
  parseYad2Html,
  parseYad2Markdown
} from '../_experimental/parser-yad2.ts';

import {
  parseMadlanHtml,
  parseMadlanMarkdown
} from '../_experimental/parser-madlan.ts';

import {
  lookupNeighborhoodByStreet,
  extractStreetFromAddress,
  normalizeStreetName,
  createSupabaseClient
} from '../_experimental/street-lookup.ts';

// Import production modules for comparison
import { extractPropertiesWithAI } from '../_shared/ai-extraction.ts';
import { scrapeWithRetry, validateScrapedContent, cleanMarkdownContent } from '../_shared/scraping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestRequest {
  mode: 'parse' | 'translate' | 'stats' | 'test-utils' | 'street-lookup' | 'compare';
  
  // For parse mode
  source?: 'homeless' | 'yad2' | 'madlan';
  html?: string;
  markdown?: string;
  url?: string;
  property_type?: 'rent' | 'sale';
  use_street_lookup?: boolean;
  
  // For translate mode
  texts?: string[];
  text?: string;
  direction?: 'he-en' | 'en-he';
  
  // For test-utils mode
  test_type?: 'price' | 'rooms' | 'city' | 'neighborhood' | 'broker' | 'all';
  test_input?: string;
  
  // For street-lookup mode
  street?: string;
  city?: string;
  streets?: Array<{ street: string; city: string }>;
  
  // For compare mode
  compare_url?: string;
  compare_source?: 'homeless' | 'yad2' | 'madlan';
  // Direct HTML/markdown input for compare mode (bypasses scraping)
  compare_html?: string;
  compare_markdown?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: TestRequest = await req.json();
    const { mode } = body;

    console.log(`[test-no-ai-scout] Mode: ${mode}`);

    switch (mode) {
      case 'stats':
        return handleStats();
      
      case 'translate':
        return handleTranslate(body);
      
      case 'parse':
        return await handleParse(body);
      
      case 'test-utils':
        return handleTestUtils(body);
      
      case 'street-lookup':
        return await handleStreetLookup(body);
      
      case 'compare':
        return await handleCompare(body);
      
      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid mode',
            valid_modes: ['parse', 'translate', 'stats', 'test-utils', 'street-lookup', 'compare'] 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('[test-no-ai-scout] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// Handler Functions
// ============================================

function handleStats(): Response {
  const stats = getDictionaryStats();
  
  return new Response(
    JSON.stringify({
      success: true,
      mode: 'stats',
      dictionary_stats: stats,
      parsers_available: ['homeless', 'yad2', 'madlan'],
      translation_directions: ['he-en', 'en-he'],
      features: ['street-lookup', 'compare'],
      message: 'Experimental non-AI system ready for testing'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ============================================
// Compare Mode: AI vs Non-AI
// ============================================

async function handleCompare(body: TestRequest): Promise<Response> {
  const source = body.compare_source || 'homeless';
  const propertyType = body.property_type || 'rent';
  
  // Default URLs for testing
  const defaultUrls: Record<string, string> = {
    homeless: 'https://www.homeless.co.il/rent/?area=1',
    yad2: 'https://www.yad2.co.il/realestate/rent?city=5000&propertyGroup=apartments',
    madlan: 'https://www.madlan.co.il/for-rent/tel-aviv-yafo'
  };
  
  const url = body.compare_url || defaultUrls[source];
  
  console.log(`[Compare] Starting AI vs Non-AI comparison for ${source}`);
  
  let html: string;
  let markdown: string;
  let scrapeTime = 0;
  let inputMode: 'direct' | 'scrape';
  
  // Check if direct HTML/markdown input was provided
  if (body.compare_html || body.compare_markdown) {
    inputMode = 'direct';
    html = body.compare_html || '';
    markdown = body.compare_markdown || '';
    console.log(`[Compare] Using direct input: ${html.length} chars HTML, ${markdown.length} chars markdown`);
  } else {
    inputMode = 'scrape';
    console.log(`[Compare] URL: ${url}`);
    
    // Get API keys
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Scrape the page
    const scrapeStart = Date.now();
    console.log(`[Compare] Scraping ${url}...`);
    
    const scrapeResult = await scrapeWithRetry(url, firecrawlApiKey, source, 2);
    scrapeTime = Date.now() - scrapeStart;
    
    if (!scrapeResult?.data) {
      return new Response(
        JSON.stringify({ 
          error: 'Scrape failed',
          scrape_time_ms: scrapeTime,
          result: scrapeResult
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    html = scrapeResult.data.html || '';
    markdown = scrapeResult.data.markdown || '';
    
    console.log(`[Compare] Scraped ${html.length} chars HTML, ${markdown.length} chars markdown in ${scrapeTime}ms`);
    
    // Validate content
    const validation = validateScrapedContent(markdown, html, source);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid content',
          reason: validation.reason,
          html_length: html.length,
          markdown_length: markdown.length
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
  
  // Clean markdown content before parsing (mirrors production AI preprocessing)
  const cleanedMarkdown = cleanMarkdownContent(markdown, source);
  console.log(`[Compare] Cleaned markdown: ${markdown.length} → ${cleanedMarkdown.length} chars`);
  
  // 2. AI Extraction
  console.log(`[Compare] Running AI extraction...`);
  const aiStart = Date.now();
  let aiResults: any[] = [];
  let aiError: string | null = null;
  
  try {
    aiResults = await extractPropertiesWithAI(
      cleanedMarkdown, 
      html, 
      url, 
      source as 'homeless' | 'yad2' | 'madlan', 
      propertyType, 
      lovableApiKey
    );
  } catch (e) {
    aiError = e instanceof Error ? e.message : String(e);
    console.error(`[Compare] AI extraction error:`, aiError);
  }
  const aiTime = Date.now() - aiStart;
  console.log(`[Compare] AI extracted ${aiResults.length} properties in ${aiTime}ms`);
  
  // 3. Non-AI Parsing (uses cleaned content internally for Madlan)
  console.log(`[Compare] Running Non-AI parsing...`);
  const noAiStart = Date.now();
  let noAiResult: ParserResult;
  
  if (source === 'homeless') {
    noAiResult = parseHomelessHtml(html, propertyType);
  } else if (source === 'yad2') {
    noAiResult = await parseYad2Html(html, propertyType, false, url); // Pass URL for city extraction
  } else if (source === 'madlan') {
    // Madlan parser now cleans internally, but we can also use markdown
    const isHtml = html.includes('<table') || html.includes('<div') || html.includes('class=');
    noAiResult = isHtml 
      ? parseMadlanHtml(html, propertyType)
      : parseMadlanMarkdown(markdown, propertyType); // Parser cleans internally
  } else {
    noAiResult = { success: false, properties: [], stats: { total_found: 0 }, errors: [`Parser for ${source} not implemented`] };
  }
  const noAiTime = Date.now() - noAiStart;
  console.log(`[Compare] Non-AI extracted ${noAiResult.properties.length} properties in ${noAiTime}ms`);
  
  // 4. Build comparison report
  const comparison = buildComparisonReport(aiResults, noAiResult.properties, aiTime, noAiTime);
  
  return new Response(
    JSON.stringify({
      success: true,
      mode: 'compare',
      source,
      url: inputMode === 'direct' ? '(direct input)' : url,
      input_mode: inputMode,
      property_type: propertyType,
      
      scrape: {
        time_ms: scrapeTime,
        html_length: html.length,
        markdown_length: markdown.length,
        skipped: inputMode === 'direct'
      },
      
      ai_extraction: {
        count: aiResults.length,
        time_ms: aiTime,
        error: aiError,
        with_price: aiResults.filter(p => p.price).length,
        with_rooms: aiResults.filter(p => p.rooms).length,
        with_floor: aiResults.filter(p => p.floor !== undefined && p.floor !== null).length,
        with_city: aiResults.filter(p => p.city).length,
        with_neighborhood: aiResults.filter(p => p.neighborhood).length,
        with_address: aiResults.filter(p => p.address).length,
      },
      
      noai_parsing: {
        count: noAiResult.properties.length,
        time_ms: noAiTime,
        errors: noAiResult.errors?.length || 0,
        stats: noAiResult.stats,
      },
      
      comparison,
      
      samples: {
        ai: aiResults.slice(0, 3),
        noai: noAiResult.properties.slice(0, 3)
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function buildComparisonReport(
  ai: any[], 
  noAi: ParsedProperty[],
  aiTime: number,
  noAiTime: number
): Record<string, unknown> {
  const aiCount = ai.length;
  const noAiCount = noAi.length;
  
  // Field coverage comparison
  const fieldCoverage = {
    price: {
      ai: ai.filter(p => p.price).length,
      noai: noAi.filter(p => p.price !== null).length,
      ai_rate: aiCount > 0 ? Math.round(ai.filter(p => p.price).length / aiCount * 100) : 0,
      noai_rate: noAiCount > 0 ? Math.round(noAi.filter(p => p.price !== null).length / noAiCount * 100) : 0,
    },
    rooms: {
      ai: ai.filter(p => p.rooms).length,
      noai: noAi.filter(p => p.rooms !== null).length,
      ai_rate: aiCount > 0 ? Math.round(ai.filter(p => p.rooms).length / aiCount * 100) : 0,
      noai_rate: noAiCount > 0 ? Math.round(noAi.filter(p => p.rooms !== null).length / noAiCount * 100) : 0,
    },
    floor: {
      ai: ai.filter(p => p.floor !== undefined && p.floor !== null).length,
      noai: noAi.filter(p => p.floor !== null).length,
      ai_rate: aiCount > 0 ? Math.round(ai.filter(p => p.floor !== undefined && p.floor !== null).length / aiCount * 100) : 0,
      noai_rate: noAiCount > 0 ? Math.round(noAi.filter(p => p.floor !== null).length / noAiCount * 100) : 0,
    },
    city: {
      ai: ai.filter(p => p.city).length,
      noai: noAi.filter(p => p.city !== null).length,
      ai_rate: aiCount > 0 ? Math.round(ai.filter(p => p.city).length / aiCount * 100) : 0,
      noai_rate: noAiCount > 0 ? Math.round(noAi.filter(p => p.city !== null).length / noAiCount * 100) : 0,
    },
    neighborhood: {
      ai: ai.filter(p => p.neighborhood).length,
      noai: noAi.filter(p => p.neighborhood !== null).length,
      ai_rate: aiCount > 0 ? Math.round(ai.filter(p => p.neighborhood).length / aiCount * 100) : 0,
      noai_rate: noAiCount > 0 ? Math.round(noAi.filter(p => p.neighborhood !== null).length / noAiCount * 100) : 0,
    },
    address: {
      ai: ai.filter(p => p.address).length,
      noai: noAi.filter(p => p.address !== null).length,
      ai_rate: aiCount > 0 ? Math.round(ai.filter(p => p.address).length / aiCount * 100) : 0,
      noai_rate: noAiCount > 0 ? Math.round(noAi.filter(p => p.address !== null).length / noAiCount * 100) : 0,
    },
  };
  
  // Speed comparison
  const speedRatio = aiTime > 0 ? Math.round(aiTime / noAiTime) : 0;
  
  // Try to match properties by price+rooms to compare accuracy
  const matchedPairs: Array<{ ai: any; noai: ParsedProperty; match_quality: string }> = [];
  
  for (const aiProp of ai) {
    if (!aiProp.price || !aiProp.rooms) continue;
    
    const match = noAi.find(noAiProp => 
      noAiProp.price === aiProp.price && 
      noAiProp.rooms === aiProp.rooms
    );
    
    if (match) {
      const qualities: string[] = [];
      if (aiProp.floor === match.floor) qualities.push('floor');
      if (aiProp.city === match.city) qualities.push('city');
      if (aiProp.neighborhood === match.neighborhood) qualities.push('neighborhood');
      
      matchedPairs.push({
        ai: { price: aiProp.price, rooms: aiProp.rooms, floor: aiProp.floor, city: aiProp.city, neighborhood: aiProp.neighborhood },
        noai: { price: match.price, rooms: match.rooms, floor: match.floor, city: match.city, neighborhood: match.neighborhood },
        match_quality: qualities.join(', ') || 'price+rooms only'
      });
    }
  }
  
  // Generate verdict
  let verdict = '';
  if (noAiCount >= aiCount && noAiTime < aiTime / 10) {
    verdict = '✅ Non-AI parser is faster and extracts equal or more properties';
  } else if (noAiCount >= aiCount * 0.9) {
    verdict = '⚠️ Non-AI parser extracts ~90%+ of AI results but much faster';
  } else {
    verdict = '❌ AI extracts significantly more properties - parser needs improvement';
  }
  
  return {
    count_comparison: {
      ai: aiCount,
      noai: noAiCount,
      difference: noAiCount - aiCount,
      diff_label: noAiCount >= aiCount ? `+${noAiCount - aiCount} (noai)` : `${noAiCount - aiCount} (noai)`
    },
    
    speed_comparison: {
      ai_ms: aiTime,
      noai_ms: noAiTime,
      ratio: `${speedRatio}x faster (noai)`,
    },
    
    cost_comparison: {
      ai: '~0.01-0.02 credits',
      noai: '0 credits'
    },
    
    field_coverage: fieldCoverage,
    
    matched_pairs: matchedPairs.slice(0, 5),
    total_matched: matchedPairs.length,
    
    verdict
  };
}

function handleTranslate(body: TestRequest): Response {
  const { texts, text, direction = 'he-en' } = body;
  
  // Single text translation
  if (text) {
    const result = direction === 'he-en' 
      ? translateHebrewToEnglish(text)
      : translateEnglishToHebrew(text);
    
    return new Response(
      JSON.stringify({
        success: true,
        mode: 'translate',
        direction,
        result,
        untranslated_analysis: findUntranslatedWords(text)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Batch translation
  if (texts && Array.isArray(texts)) {
    const batchResult = batchTranslate(texts, direction);
    
    return new Response(
      JSON.stringify({
        success: true,
        mode: 'translate',
        direction,
        batch_result: batchResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ error: 'Missing text or texts parameter' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleParse(body: TestRequest): Promise<Response> {
  const { source, html, property_type = 'rent', use_street_lookup = true } = body;
  
  if (!html) {
    return new Response(
      JSON.stringify({ error: 'Missing html parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (!source) {
    return new Response(
      JSON.stringify({ error: 'Missing source parameter (homeless, yad2, madlan)' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Detect if input is HTML or markdown
  const isHtml = html.includes('<table') || html.includes('<tr') || html.includes('<td') || 
                 html.includes('<div') || html.includes('class=');
  
  // Parse based on source
  if (source === 'homeless') {
    const result = isHtml 
      ? parseHomelessHtml(html, property_type)
      : parseHomelessMarkdown(html, property_type);
    
    return new Response(
      JSON.stringify({
        success: true,
        mode: 'parse',
        source: 'homeless',
        property_type,
        format_detected: isHtml ? 'html' : 'markdown',
        ...result,
        sample: result.properties.slice(0, 3)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (source === 'yad2') {
    const result = isHtml 
      ? await parseYad2Html(html, property_type, use_street_lookup)
      : parseYad2Markdown(html, property_type);
    
    return new Response(
      JSON.stringify({
        success: true,
        mode: 'parse',
        source: 'yad2',
        property_type,
        format_detected: isHtml ? 'html' : 'markdown',
        use_street_lookup,
        ...result,
        sample: result.properties.slice(0, 3)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (source === 'madlan') {
    // Check for HTML/JSON - includes SSR context check for embedded JSON data
    const isHtmlOrJson = html.includes('__SSR_HYDRATED_CONTEXT__') || 
                         html.includes('<table') || 
                         html.includes('<div') || 
                         html.includes('class=') ||
                         html.includes('<html') ||
                         html.includes('<script');
    
    const result = isHtmlOrJson 
      ? parseMadlanHtml(html, property_type)
      : parseMadlanMarkdown(html, property_type);
    
    // Determine format for reporting
    let formatDetected = 'markdown';
    if (html.includes('__SSR_HYDRATED_CONTEXT__')) {
      formatDetected = 'json-ssr';
    } else if (html.includes('<html') || html.includes('<div')) {
      formatDetected = 'html';
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        mode: 'parse',
        source: 'madlan',
        property_type,
        format_detected: formatDetected,
        ...result,
        sample: result.properties.slice(0, 3)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Unknown source
  return new Response(
    JSON.stringify({
      success: false,
      mode: 'parse',
      source,
      error: `Parser for ${source} not implemented.`,
      available_parsers: ['homeless', 'yad2', 'madlan']
    }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ============================================
// Street Lookup Handler
// ============================================

async function handleStreetLookup(body: TestRequest): Promise<Response> {
  const { street, city, streets } = body;
  
  const supabase = createSupabaseClient();
  
  // Single street lookup
  if (street && city) {
    const normalized = normalizeStreetName(street);
    const result = await lookupNeighborhoodByStreet(supabase, street, city);
    
    return new Response(
      JSON.stringify({
        success: true,
        mode: 'street-lookup',
        input: { street, city },
        normalized_street: normalized,
        result: result || { neighborhood: null, message: 'No match found' }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Batch lookup
  if (streets && Array.isArray(streets)) {
    const results: Array<{
      input: { street: string; city: string };
      normalized: string;
      result: any;
    }> = [];
    
    for (const { street: s, city: c } of streets) {
      const normalized = normalizeStreetName(s);
      const result = await lookupNeighborhoodByStreet(supabase, s, c);
      results.push({
        input: { street: s, city: c },
        normalized,
        result: result || { neighborhood: null }
      });
    }
    
    const matchRate = results.filter(r => r.result?.neighborhood).length / results.length * 100;
    
    return new Response(
      JSON.stringify({
        success: true,
        mode: 'street-lookup',
        batch: true,
        total: results.length,
        matched: results.filter(r => r.result?.neighborhood).length,
        match_rate: `${matchRate.toFixed(1)}%`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ 
      error: 'Missing street/city or streets array parameter',
      example_single: { street: 'ויינגייט 15', city: 'תל אביב יפו' },
      example_batch: { streets: [{ street: 'ויינגייט', city: 'תל אביב יפו' }] }
    }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function handleTestUtils(body: TestRequest): Response {
  const { test_type = 'all', test_input = '' } = body;
  
  const results: Record<string, unknown> = {};
  
  if (test_type === 'price' || test_type === 'all') {
    const testPrices = test_input ? [test_input] : [
      '₪8,500',
      '8500 ש"ח',
      '₪12,000 לחודש',
      '3,500,000',
      'מחיר: 9000'
    ];
    results.price_extraction = testPrices.map(p => ({
      input: p,
      extracted: extractPrice(p)
    }));
  }
  
  if (test_type === 'rooms' || test_type === 'all') {
    const testRooms = test_input ? [test_input] : [
      '3 חדרים',
      '3.5',
      '4 חד\'',
      'דירת 2 חדרים'
    ];
    results.rooms_extraction = testRooms.map(r => ({
      input: r,
      extracted: extractRooms(r)
    }));
  }
  
  if (test_type === 'city' || test_type === 'all') {
    const testCities = test_input ? [test_input] : [
      'דירה בתל אביב',
      'רמת גן, רחוב ביאליק',
      'הרצליה פיתוח',
      'פ"ת מרכז'
    ];
    results.city_extraction = testCities.map(c => ({
      input: c,
      extracted: extractCity(c)
    }));
  }
  
  if (test_type === 'neighborhood' || test_type === 'all') {
    const testNeighborhoods = test_input ? [test_input] : [
      'פלורנטין, תל אביב',
      'הצפון הישן',
      'רמת אביב החדשה',
      'אזור הבורסה, רמת גן'
    ];
    results.neighborhood_extraction = testNeighborhoods.map(n => {
      const city = extractCity(n);
      return {
        input: n,
        detected_city: city,
        extracted: extractNeighborhood(n, city)
      };
    });
  }
  
  if (test_type === 'broker' || test_type === 'all') {
    const testBrokers = test_input ? [test_input] : [
      'תיווך נדל"ן',
      'רימקס ישראל',
      'בעלים פרטי',
      'סוכנות אנגלו סכסון',
      'דירה למכירה מבעלים'
    ];
    results.broker_detection = testBrokers.map(b => ({
      input: b,
      is_broker: detectBroker(b)
    }));
  }
  
  return new Response(
    JSON.stringify({
      success: true,
      mode: 'test-utils',
      test_type,
      results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
