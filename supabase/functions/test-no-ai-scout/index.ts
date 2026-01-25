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
  lookupNeighborhoodByStreet,
  extractStreetFromAddress,
  normalizeStreetName,
  createSupabaseClient
} from '../_experimental/street-lookup.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestRequest {
  mode: 'parse' | 'translate' | 'stats' | 'test-utils' | 'street-lookup';
  
  // For parse mode
  source?: 'homeless' | 'yad2' | 'madlan';
  html?: string;
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
      
      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid mode',
            valid_modes: ['parse', 'translate', 'stats', 'test-utils', 'street-lookup'] 
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
      parsers_available: ['homeless', 'yad2'],
      translation_directions: ['he-en', 'en-he'],
      features: ['street-lookup'],
      message: 'Experimental non-AI system ready for testing'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
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
  
  // Madlan not yet implemented
  return new Response(
    JSON.stringify({
      success: true,
      mode: 'parse',
      source,
      property_type,
      message: `Parser for ${source} not yet implemented.`,
      html_length: html.length,
      available_parsers: ['homeless', 'yad2', 'madlan (coming soon)']
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
