// Phone extraction worker
// - Cron: processes 1 property per invocation with 15–45s human-like delay
// - Manual (from UI button): processes up to 20 properties, no delay, with 50s wall-clock guard
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MANUAL_BATCH_SIZE = 20;
const WALL_CLOCK_LIMIT_MS = 50_000; // stay well within Supabase's 60s edge-function timeout

// Minutes-since-midnight in Israel time, so the window honors minutes (e.g. 08:30),
// not just the hour. Previously only the hour was parsed, so '08:30'→8 / '09:30'→9
// collapsed a 08:30–09:30 window into 08:00–08:59.
function israelNowMinutes(): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

// Parse 'HH:MM' (or 'HH') to minutes-since-midnight; fall back on bad input.
function parseHHMMToMinutes(raw: string, fallbackMin: number): number {
  const cleaned = String(raw).replace(/"/g, '').trim();
  const [hh, mm] = cleaned.split(':');
  const h = parseInt(hh, 10);
  if (Number.isNaN(h)) return fallbackMin;
  const m = parseInt(mm ?? '0', 10);
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

function isWithinWindow(startMin: number, endMin: number): boolean {
  const now = israelNowMinutes();
  return now >= startMin && now < endMin;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const startedAt = new Date().toISOString();
  const wallStart = Date.now();
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  let body: { manual?: boolean } = {};
  try {
    if (req.method === 'POST') body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }
  const manual = body.manual === true;
  const batchSize = manual ? MANUAL_BATCH_SIZE : 1;

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
  const startMin = parseHHMMToMinutes(rawStart, 9 * 60);
  const endMin   = parseHHMMToMinutes(rawEnd, 21 * 60);

  // 2. Time window (skip if manual — manual always runs)
  if (!manual && !isWithinWindow(startMin, endMin)) {
    return new Response(
      JSON.stringify({ skipped: true, reason: 'outside_working_hours', window: `${rawStart}–${rawEnd}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // 3. Pick up to batchSize properties from the queue
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
    .limit(batchSize);

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

  // 4. Create a single run record for the whole batch
  const { data: run } = await supabase
    .from('phone_extraction_runs')
    .insert({
      status: 'running',
      source: candidates[0].source,
      triggered_by: manual ? 'manual' : 'cron',
      properties_attempted: candidates.length,
    })
    .select('id')
    .single();

  // 5. Process each candidate
  const results: { property_id: string; phone_found: boolean; phone?: string }[] = [];
  let phonesFound = 0;
  let errorsCount = 0;

  for (let i = 0; i < candidates.length; i++) {
    // Wall-clock guard — stop before Supabase kills us
    if (Date.now() - wallStart > WALL_CLOCK_LIMIT_MS) {
      console.log(`Batch stopping early after ${i} properties (wall-clock limit)`);
      break;
    }

    const target = candidates[i];
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
      if (result?.phone) { phoneFound = true; phonesFound++; }
      if (result?.error) { errorOccurred = true; errorsCount++; }
    } catch (e) {
      errorOccurred = true;
      errorsCount++;
      result = { error: (e as Error).message };
    }

    results.push({ property_id: target.id, phone_found: phoneFound, phone: result?.phone });

    // Cron only: human-like random delay after processing (not needed for manual)
    if (!manual && i < candidates.length - 1) {
      const delayMs = 15000 + Math.floor(Math.random() * 30000);
      await sleep(delayMs);
    }
  }

  // 6. Finalize run
  if (run?.id) {
    await supabase
      .from('phone_extraction_runs')
      .update({
        ended_at: new Date().toISOString(),
        status: 'completed',
        phones_found: phonesFound,
        errors_count: errorsCount,
        notes: {
          batch_size: results.length,
          phones_found: phonesFound,
          // Only keep first 5 results in notes to avoid bloating the column
          sample: results.slice(0, 5),
        },
      })
      .eq('id', run.id);
  }

  return new Response(
    JSON.stringify({
      success: true,
      processed: results.length,
      phones_found: phonesFound,
      errors: errorsCount,
      started_at: startedAt,
      // Legacy field — kept so existing onSuccess check still works
      phone_found: phonesFound > 0,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
