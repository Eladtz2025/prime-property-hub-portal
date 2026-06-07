// Phone extraction — Homeless (TrackEngagement API), Yad2 (CF Worker proxy), Madlan (Jina regex)
// Stateless: receives a property, fetches phone, writes to DB.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CF_WORKER_URL = 'https://yad2-proxy.taylor-kelly88.workers.dev/';

// ==================== Phone normalization ====================

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 9 && digits.startsWith('5')) {
    return '0' + digits;
  }
  if (digits.length !== 10) return null;
  if (!digits.startsWith('0')) return null;
  if (!/^0(5\d|[2-4]|[7-9])/.test(digits)) return null;
  return digits;
}

// ==================== Homeless ====================

function parseHomelessUrl(url: string): { boardType: string; adId: string } | null {
  const m = url.match(/homeless\.co\.il\/([^\/]+)\/viewad,(\d+)\.aspx/i);
  if (!m) return null;
  return { boardType: m[1], adId: m[2] };
}

async function fetchHomelessPhone(sourceUrl: string): Promise<{ phone: string | null; httpStatus: number; error: string | null }> {
  const parsed = parseHomelessUrl(sourceUrl);
  if (!parsed) return { phone: null, httpStatus: 0, error: 'invalid_homeless_url' };

  const resp = await fetch('https://www.homeless.co.il/TrackEngagement.ashx', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Referer': sourceUrl,
      'Origin': 'https://www.homeless.co.il',
    },
    body: `action=phonereveal&boardType=${encodeURIComponent(parsed.boardType)}&adId=${encodeURIComponent(parsed.adId)}`,
  });

  if (!resp.ok) return { phone: null, httpStatus: resp.status, error: `http_${resp.status}` };

  const text = await resp.text();
  let raw: string | null = null;
  try {
    const j = JSON.parse(text);
    raw = typeof j?.d === 'string' ? j.d : null;
  } catch {
    raw = text;
  }

  if (!raw || raw.trim() === '' || raw.trim() === '0') {
    return { phone: null, httpStatus: resp.status, error: null };
  }

  const candidates = raw.split(',').map((s) => s.trim()).filter(Boolean);
  for (const c of candidates) {
    const p = normalizePhone(c);
    if (p) return { phone: p, httpStatus: resp.status, error: null };
  }
  return { phone: null, httpStatus: resp.status, error: null };
}

// ==================== Yad2 ====================

function parseYad2Token(sourceUrl: string): string | null {
  const m = sourceUrl.match(/yad2\.co\.il\/realestate\/item\/(?:[^\/]+\/)?([a-zA-Z0-9]+)/i);
  return m ? m[1] : null;
}

async function fetchYad2Phone(sourceUrl: string, _propertyType: string): Promise<{ phone: string | null; httpStatus: number; error: string | null }> {
  const token = parseYad2Token(sourceUrl);
  if (!token) return { phone: null, httpStatus: 0, error: 'invalid_yad2_url' };

  // gw.yad2.co.il/realestate-item/{token}/customer returns the owner phone publicly
  // (no auth required — confirmed 2026-06-07). Standard iPhone headers bypass the WAF.
  try {
    const resp = await fetch(`https://gw.yad2.co.il/realestate-item/${token}/customer`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.yad2.co.il',
        'Referer': 'https://www.yad2.co.il/',
      },
    });
    if (!resp.ok) return { phone: null, httpStatus: resp.status, error: `http_${resp.status}` };
    const data = await resp.json();
    const raw = data?.data?.phone || data?.data?.brokerPhone || null;
    if (!raw) return { phone: null, httpStatus: resp.status, error: 'no_phone_in_response' };
    const normalized = normalizePhone(String(raw));
    return { phone: normalized, httpStatus: resp.status, error: normalized ? null : 'invalid_phone_format' };
  } catch (e) {
    return { phone: null, httpStatus: 0, error: `fetch_error:${(e as Error).message}`.slice(0, 100) };
  }
}

// ==================== Madlan ====================

async function fetchMadlanPhone(sourceUrl: string): Promise<{ phone: string | null; httpStatus: number; error: string | null }> {
  // Fetch detail page via Jina and regex for visible Israeli phone numbers.
  // Madlan broker listings often show the office number without a reveal click.
  // Private seller phones are gated — this catches what's visible in the page.
  try {
    const jinaApiKey = Deno.env.get('JINA_API_KEY');
    const headers: Record<string, string> = {
      'Accept': 'text/markdown',
      'X-No-Cache': 'true',
      'X-Timeout': '20',
    };
    if (jinaApiKey) headers['Authorization'] = `Bearer ${jinaApiKey}`;

    const resp = await fetch(`https://r.jina.ai/${sourceUrl}`, { headers });
    if (!resp.ok) return { phone: null, httpStatus: resp.status, error: `http_${resp.status}` };

    const text = await resp.text();

    // Israeli phone patterns: mobile 05X-XXXXXXX, landline 0X-XXXXXXX
    const patterns = [
      /\b(0[5][0-9][\-\s]?\d{3}[\-\s]?\d{4})\b/g,
      /\b(0[2-4][\-\s]?\d{7})\b/g,
      /\b(0[7-9][\-\s]?\d{7})\b/g,
    ];

    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern)) {
        const normalized = normalizePhone(match[1]);
        if (normalized) return { phone: normalized, httpStatus: resp.status, error: null };
      }
    }

    return { phone: null, httpStatus: resp.status, error: null };
  } catch (e) {
    return { phone: null, httpStatus: 0, error: `fetch_error:${(e as Error).message}`.slice(0, 100) };
  }
}

// ==================== Main handler ====================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { property_id, source_url, source } = await req.json();
    if (!property_id || !source_url) {
      return new Response(JSON.stringify({ error: 'missing property_id or source_url' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Read current state + property_type in one query
    const { data: cur } = await supabase
      .from('scouted_properties')
      .select('phone_extraction_attempts, owner_phone, property_type')
      .eq('id', property_id)
      .single();

    const propertyType: string = cur?.property_type || 'rent';
    const newAttempts = (cur?.phone_extraction_attempts ?? 0) + 1;

    let phone: string | null = null;
    let errorMsg: string | null = null;
    let httpStatus = 0;

    try {
      if (source === 'homeless' || source_url.includes('homeless')) {
        const r = await fetchHomelessPhone(source_url);
        phone = r.phone; httpStatus = r.httpStatus; errorMsg = r.error;
      } else if (source === 'yad2' || source_url.includes('yad2')) {
        const r = await fetchYad2Phone(source_url, propertyType);
        phone = r.phone; httpStatus = r.httpStatus; errorMsg = r.error;
      } else if (source === 'madlan' || source_url.includes('madlan')) {
        const r = await fetchMadlanPhone(source_url);
        phone = r.phone; httpStatus = r.httpStatus; errorMsg = r.error;
      } else {
        errorMsg = `source_not_supported:${source}`;
      }
    } catch (e) {
      errorMsg = `fetch_error:${(e as Error).message}`.slice(0, 200);
    }

    const updatePayload: Record<string, unknown> = {
      phone_extraction_attempts: newAttempts,
      phone_extracted_at: new Date().toISOString(),
    };

    if (phone) {
      updatePayload.owner_phone = phone;
      updatePayload.phone_extraction_status = 'success';
      updatePayload.phone_extraction_last_error = null;
    } else if (errorMsg) {
      updatePayload.phone_extraction_status = newAttempts >= 3 ? 'failed' : 'pending';
      updatePayload.phone_extraction_last_error = errorMsg;
    } else {
      updatePayload.phone_extraction_status = 'not_found';
      updatePayload.phone_extraction_last_error = null;
    }

    const { error: upErr } = await supabase
      .from('scouted_properties')
      .update(updatePayload)
      .eq('id', property_id);

    if (upErr) {
      return new Response(JSON.stringify({ error: 'db_update_failed', details: upErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        phone,
        status: updatePayload.phone_extraction_status,
        attempts: newAttempts,
        http: httpStatus,
        error: errorMsg,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
