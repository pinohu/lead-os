/**
 * CORS configuration for edge functions
 * Restricts origins to notroom.com domains only
 */

const PRODUCTION_ORIGINS = [
  'https://notroom.com',
  'https://www.notroom.com',
];

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
];

const isProduction = Deno.env.get('ENVIRONMENT') === 'production' || 
  !Deno.env.get('ENVIRONMENT');

const ALLOWED_ORIGINS = isProduction ? PRODUCTION_ORIGINS : [...PRODUCTION_ORIGINS, ...DEV_ORIGINS];

/**
 * Get CORS headers with proper origin validation
 */
export function getCorsHeaders(origin: string | null): HeadersInit {
  // Check if origin is allowed
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cf-connecting-ip, x-forwarded-for',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest(req: Request): Response {
  const origin = req.headers.get('origin');
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin)
  });
}

/**
 * Validate origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  return origin !== null && ALLOWED_ORIGINS.includes(origin);
}
