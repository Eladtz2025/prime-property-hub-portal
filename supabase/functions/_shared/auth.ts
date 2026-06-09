// Shared auth helpers for the social/marketing edge functions.
//
// Three legitimate caller types hit these functions:
//   1. The admin UI  — sends the logged-in user's JWT (Authorization: Bearer <user jwt>).
//   2. Internal server-to-server calls (social-scheduler / auto-publish -> social-publish)
//      — send the service-role key as the bearer token.
//   3. pg_cron — sends a shared secret in the `x-cron-secret` header (value from Vault).
//
// Anything else (e.g. an anonymous caller holding only the public anon key) must be rejected.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

function bearer(req: Request): string | null {
  const h = req.headers.get('Authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

// Length-aware constant-time comparison so we don't leak secret length via early exit.
function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** True when the bearer token is the service-role key (internal server-to-server call). */
export function isInternalCall(req: Request): boolean {
  const token = bearer(req);
  const svc = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  return !!token && safeEqual(token, svc);
}

/** True when the request carries the correct CRON_SECRET (pg_cron call). */
export function hasCronSecret(req: Request): boolean {
  const got = req.headers.get('x-cron-secret') || '';
  const want = Deno.env.get('CRON_SECRET') || '';
  return safeEqual(got, want);
}

/** True when the caller's JWT belongs to an admin / super_admin user. */
export async function isAdmin(req: Request): Promise<boolean> {
  const token = bearer(req);
  if (!token) return false;

  const url = Deno.env.get('SUPABASE_URL') || '';
  const anon = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const svc = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  // The service-role key is not a user — callers that want to allow it use isInternalCall().
  if (safeEqual(token, svc)) return false;

  // Verify the JWT and resolve the user.
  const authed = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error } = await authed.auth.getUser();
  if (error || !user) return false;

  // Check the role with the service-role client (user_roles is the source of truth).
  const admin = createClient(url, svc);
  const { data, error: roleErr } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'super_admin'])
    .limit(1);

  return !roleErr && !!data && data.length > 0;
}

/** Standard 401 response with the given CORS headers. */
export function unauthorized(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
