// Phone extraction worker - cron-triggered, processes ONE property per invocation.
// Slow & safe: random delay, time window check, kill switch.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function israelHourNow(): number {
  return parseInt(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jerusalem',
      hour: '2-digit',
      hour12: false,
    }).format(new Date()),
    10,
  );
}

function isWithinWindow(startHour: number, endHour: number): boolean {
  const h = israelHourNow();
  return h >= startHour && h < endHour;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const startedAt = new Date().toISOString();
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  let body: { manual?: boolean } = {};
  try {
    if (req.method === 'POST') body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }
  const manual = body.manual === true;

  // 1. Kill switch + time window config (parallel DB reads)
  const [flagRes, windowRes] = await Promise.all([
    supabase.from('feature_flags').select('is_enabled').eq('name', 'process_phone_extraction').single(),
    supabase.from('scout_settings')
      .select('setting_key, setting_value')
      .eq('category', 'phoneExtraction')
      .in('setting_key', ['window_start', 'window_end']),
  ]);

  if (!flagRes.data?.is_enabled) {
    return new Response(
      JSON.stringify({ skipped: true, reason: 'feature_flag_disabled' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // Parse window from DB, fall back to 09:00–21:00
  const rows = windowRes.data ?? [];
  const rawStart = rows.find(r => r.setting_key === 'window_start')?.setting_value ?? '09:00';
  const rawEnd   = rows.find(r => r.setting_key === 'window_end')?.setting_value   ?? '21:00';
  const startHour = parseInt(String(rawStart).replace(/"/g, '').split(':')[0], 10) || 9;
  const endHour   = parseInt(String(rawEnd).replace(/"/g, '').split(':')[0], 10)   || 21;

  // 2. Time window (skip if manual)
  if (!manual && !isWithinWindow(startHour, endHour)) {
    return new Response(
      JSON.stringify({ skipped: true, reason: 'outside_working_hours', window: `${startHour}–${endHour}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // 3. Pick one property from the queue — all three sources, private listings only
  const { data: candidates, error: qErr } = await supabase
    .from('scouted_properties')
    .select('id, source, source_url, owner_phone, phone_extraction_status, phone_extraction_attempts')
    .eq('is_active', true)
    .eq('is_private', true)
    .in('source', ['homeless', 'yad2', 'madlan'])
    .or('owner_phone.is.null,owner_phone.eq.')
    .lt('phone_extraction_attempts', 3)
    .or('phone_extraction_status.is.null,and(phone_extraction_status.neq.success,phone_extraction_status.neq.not_found)')
    .not('source_url', 'is', null)
    .order('phone_extraction_attempts', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1);

  if (qErr) {
    return new Response(
      JSON.stringify({ error: 'queue_query_failed', details: qErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  if (!candidates || candidates.length === 0) {
    return new Response(
      JSON.stringify({ skipped: true, reason: 'queue_empty' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const target = candidates[0];

  // 4. Create run record
  const { data: run } = await supabase
    .from('phone_extraction_runs')
    .insert({
      status: 'running',
      source: target.source,
      triggered_by: manual ? 'manual' : 'cron',
      properties_attempted: 1,
    })
    .select('id')
    .single();

  // 5. Call extract-phone
  let phoneFound = false;
  let errorOccurred = false;
  let result: any = null;

  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/extract-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({
        property_id: target.id,
        source_url: target.source_url,
        source: target.source,
      }),
    });
    result = await resp.json();
    if (result?.phone) phoneFound = true;
    if (result?.error) errorOccurred = true;
  } catch (e) {
    errorOccurred = true;
    result = { error: (e as Error).message };
  }

  // 6. Random delay (15–45s) to look human (skip on manual to give snappier UX)
  if (!manual) {
    const delayMs = 15000 + Math.floor(Math.random() * 30000);
    await sleep(delayMs);
  }

  // 7. Finalize run
  if (run?.id) {
    await supabase
      .from('phone_extraction_runs')
      .update({
        ended_at: new Date().toISOString(),
        status: 'completed',
        phones_found: phoneFound ? 1 : 0,
        errors_count: errorOccurred ? 1 : 0,
        notes: { property_id: target.id, result },
      })
      .eq('id', run.id);
  }

  return new Response(
    JSON.stringify({
      success: true,
      property_id: target.id,
      phone_found: phoneFound,
      result,
      started_at: startedAt,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
