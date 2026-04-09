const ALLOWED_ORIGINS = [
  'https://www.ctmarketproperties.com',
  'https://ctmarketproperties.com',
  'https://primepropertyai.lovable.app',
  'https://id-preview--99d4f020-36e5-4778-a578-516b9e139943.lovable.app',
];

export function getRestrictedCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

export function handleCorsOptions(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getRestrictedCorsHeaders(req) });
  }
  return null;
}
