import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchYad2DetailFeatures } from '../_shared/yad2-detail-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const url = body.url || 'https://www.yad2.co.il/realestate/item/vzas3xxi';
  const mode = body.mode || 'yad2_api';

  if (mode === 'yad2_api') {
    const result = await fetchYad2DetailFeatures(url);
    return new Response(JSON.stringify({ url, result }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Debug: try direct API call with various header combos
  if (mode === 'debug_api') {
    const token = url.match(/\/item\/([a-z0-9]+)/i)?.[1] || url;
    const apiUrl = `https://gw.yad2.co.il/realestate-item/${token}`;
    
    const results: any = {};

    // Attempt 1: minimal
    try {
      const r1 = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Referer': 'https://www.yad2.co.il/',
          'Origin': 'https://www.yad2.co.il',
        },
      });
      const txt = await r1.text();
      results.attempt1 = { status: r1.status, size: txt.length, body_preview: txt.substring(0, 300) };
    } catch (e: any) {
      results.attempt1 = { error: e.message };
    }

    // Attempt 2: no origin, different UA
    try {
      const r2 = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      const txt = await r2.text();
      results.attempt2 = { status: r2.status, size: txt.length, body_preview: txt.substring(0, 300) };
    } catch (e: any) {
      results.attempt2 = { error: e.message };
    }

    // Attempt 3: mobile UA
    try {
      const r3 = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
          'Referer': 'https://m.yad2.co.il/',
        },
      });
      const txt = await r3.text();
      results.attempt3_mobile = { status: r3.status, size: txt.length, body_preview: txt.substring(0, 300) };
    } catch (e: any) {
      results.attempt3_mobile = { error: e.message };
    }

    // Attempt 4: API gateway with sec-ch headers
    try {
      const r4 = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Referer': 'https://www.yad2.co.il/',
          'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      });
      const txt = await r4.text();
      results.attempt4_secch = { status: r4.status, size: txt.length, body_preview: txt.substring(0, 500) };
    } catch (e: any) {
      results.attempt4_secch = { error: e.message };
    }

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fallback: raw fetch
  const res = await fetch(url, {
    headers: { 'Accept': '*/*', 'Accept-Language': 'he-IL,he;q=0.9' },
  });
  const html = await res.text();
  return new Response(JSON.stringify({ status: res.status, size: html.length }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
