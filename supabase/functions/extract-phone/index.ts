// Phone extraction (Homeless only - Phase 1)
// Stateless: receives a property, fetches its source URL, extracts phone, writes to DB.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 9 && digits.startsWith('5')) {
    return '0' + digits;
  }
  if (digits.length !== 10) return null;
  if (!digits.startsWith('0')) return null;
  // Israeli mobile (05X) or landline (02/03/04/08/09/072/073/074/076/077)
  if (!/^0(5\d|[2-4]|[7-9])/.test(digits)) return null;
  return digits;
}

function parseHomelessUrl(url: string): { boardType: string; adId: string } | null {
  // e.g. https://www.homeless.co.il/sale/viewad,257070.aspx
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

  if (!resp.ok) {
    return { phone: null, httpStatus: resp.status, error: `http_${resp.status}` };
  }

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

  // raw can be "050-XXXXXXX" or "050-XXXXXXX,03-YYYYYYY"
  const candidates = raw.split(',').map((s) => s.trim()).filter(Boolean);
  for (const c of candidates) {
    const p = normalizePhone(c);
    if (p) return { phone: p, httpStatus: resp.status, error: null };
  }
  return { phone: null, httpStatus: resp.status, error: null };
}

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

    let phone: string | null = null;
    let errorMsg: string | null = null;
    let httpStatus = 0;

    try {
      if (source === 'homeless' || source_url.includes('homeless')) {
        const r = await fetchHomelessPhone(source_url);
        phone = r.phone;
        httpStatus = r.httpStatus;
        errorMsg = r.error;
      } else {
        errorMsg = `source_not_supported:${source}`;
      }
    } catch (e) {
      errorMsg = `fetch_error:${(e as Error).message}`.slice(0, 200);
    }

    // Update DB - preserve all other fields (data integrity)
    const updates: Record<string, unknown> = {
      phone_extraction_attempts: undefined, // we'll increment via RPC-less raw
      phone_extracted_at: new Date().toISOString(),
    };

    // Get current attempts to increment
    const { data: cur } = await supabase
      .from('scouted_properties')
      .select('phone_extraction_attempts, owner_phone')
      .eq('id', property_id)
      .single();

    const newAttempts = (cur?.phone_extraction_attempts ?? 0) + 1;

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
