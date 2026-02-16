// Firecrawl API key rotation - automatic failover between accounts
// When a key hits rate limit (402/429), it's marked exhausted and the next key is used.
// Keys auto-reset after 24 hours.

/**
 * Get the highest-priority active Firecrawl API key.
 * Resets keys exhausted > 24h ago before selecting.
 * Falls back to FIRECRAWL_API_KEY env var if no DB keys available.
 */
export async function getActiveFirecrawlKey(
  supabase: any,
  skipEnvFallback = false
): Promise<{ key: string; id: string | null }> {
  // 1. Always reset keys exhausted more than 24 hours ago (even before checking DB)
  try {
    const resetCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: resetData } = await supabase
      .from('firecrawl_api_keys')
      .update({ status: 'active', exhausted_at: null })
      .eq('status', 'exhausted')
      .lt('exhausted_at', resetCutoff)
      .select('label');
    if (resetData?.length) {
      console.log(`🔄 Auto-reset ${resetData.length} exhausted keys: ${resetData.map((k: any) => k.label).join(', ')}`);
    }
  } catch (err) {
    console.warn('Warning: failed to reset exhausted keys:', err);
  }

  try {
    // 2. Get highest priority active key
    const { data, error } = await supabase
      .from('firecrawl_api_keys')
      .select('id, api_key, label, total_uses')
      .eq('status', 'active')
      .order('priority', { ascending: true })
      .limit(1)
      .single();

    if (data && !error) {
      console.log(`🔑 Using Firecrawl key: "${data.label}"`);
      // Increment usage counter (fire and forget)
      supabase
        .from('firecrawl_api_keys')
        .update({ total_uses: (data.total_uses || 0) + 1 })
        .eq('id', data.id)
        .then(() => {});
      return { key: data.api_key, id: data.id };
    }
  } catch (err) {
    console.warn('Error fetching Firecrawl key from DB, falling back to env:', err);
  }

  // 3. Fallback to env var (connector key) — unless explicitly skipped
  if (!skipEnvFallback) {
    const envKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (envKey) {
      console.log('🔑 Using fallback FIRECRAWL_API_KEY from env');
      return { key: envKey, id: null };
    }
  }

  throw new Error('No Firecrawl API key available (no active DB keys and env fallback exhausted/skipped)');
}

/**
 * Mark a key as exhausted (hit rate limit).
 * Only works for DB keys (not env var fallback).
 */
export async function markKeyExhausted(
  supabase: any,
  keyId: string | null
): Promise<void> {
  if (!keyId) {
    console.warn('Cannot mark env var key as exhausted');
    return;
  }

  const { error } = await supabase
    .from('firecrawl_api_keys')
    .update({
      status: 'exhausted',
      exhausted_at: new Date().toISOString(),
    })
    .eq('id', keyId);

  if (error) {
    console.error(`Failed to mark key ${keyId} as exhausted:`, error);
  } else {
    console.log(`⚠️ Marked Firecrawl key ${keyId} as exhausted (rate limited)`);
  }
}

/**
 * Check if an HTTP status code indicates a rate limit / quota exhaustion.
 */
export function isRateLimitError(status: number): boolean {
  return status === 402 || status === 429;
}
