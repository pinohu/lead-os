/**
 * Webhook signature verification utilities
 * Prevents unauthorized webhook calls
 */

const encoder = new TextEncoder();

/**
 * Verify HMAC-SHA256 signature
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!secret) {
    console.warn('Webhook secret not configured - signature verification disabled');
    return true; // Backward compatibility
  }

  if (!signature) {
    return false;
  }

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const expectedSignature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Remove any prefix like 'sha256=' if present
    const providedSig = signature.toLowerCase().replace(/^sha256=/, '');
    
    return expectedHex === providedSig;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Verify JWT token from Authorization header
 */
export function verifyJWT(req: Request): { valid: boolean; error?: string } {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  // Accept either service role or anon key for internal calls
  if (token === serviceRoleKey || token === anonKey) {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid or expired token' };
}

/**
 * Extract and validate request body for webhook
 */
export async function getValidatedWebhookPayload<T>(
  req: Request
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await req.json() as T;
    return { data };
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : 'Invalid JSON payload'
    };
  }
}
