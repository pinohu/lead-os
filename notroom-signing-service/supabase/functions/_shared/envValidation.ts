/**
 * Edge Function Environment Validation Utility
 * Validates required environment variables for Supabase Edge Functions
 */

interface EdgeFunctionEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  // Webhook secrets (optional, but validated if webhook function)
  CALLSCALER_WEBHOOK_SECRET?: string;
  INSIGHTO_WEBHOOK_SECRET?: string;
  SMSIT_WEBHOOK_SECRET?: string;
  SUITEDASH_WEBHOOK_SECRET?: string;
  // API keys (optional, but validated if used)
  SMSIT_API_KEY?: string;
  WBIZTOOL_API_KEY?: string;
  SUITEDASH_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
}

/**
 * Validates edge function environment variables
 * @param required - Array of required environment variable keys
 * @returns Validated environment configuration
 * @throws Error if required variables are missing
 */
export function validateEdgeEnv(required: (keyof EdgeFunctionEnv)[]): EdgeFunctionEnv {
  const missing: string[] = [];
  const env: Partial<EdgeFunctionEnv> = {};
  
  // Always required
  const alwaysRequired: (keyof EdgeFunctionEnv)[] = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const allRequired = [...alwaysRequired, ...required];
  
  for (const envVar of allRequired) {
    const value = Deno.env.get(envVar);
    if (!value || value.trim() === '') {
      missing.push(envVar);
    } else {
      env[envVar] = value as EdgeFunctionEnv[keyof EdgeFunctionEnv];
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please set these in your Supabase project settings.\n` +
      `Go to: Project Settings > Edge Functions > Secrets`
    );
  }
  
  return env as EdgeFunctionEnv;
}

/**
 * Helper for webhook functions
 * Validates environment variables required for webhook functions
 * @param webhookName - Name of the webhook service (callscaler, insighto, smsit, suitedash)
 * @returns Validated environment configuration
 */
export function validateWebhookEnv(webhookName: string): EdgeFunctionEnv {
  const webhookSecretMap: Record<string, keyof EdgeFunctionEnv> = {
    'callscaler': 'CALLSCALER_WEBHOOK_SECRET',
    'insighto': 'INSIGHTO_WEBHOOK_SECRET',
    'smsit': 'SMSIT_WEBHOOK_SECRET',
    'suitedash': 'SUITEDASH_WEBHOOK_SECRET'
  };
  
  const webhookSecret = webhookSecretMap[webhookName.toLowerCase()];
  const required = webhookSecret ? [webhookSecret] : [];
  
  return validateEdgeEnv(required);
}

/**
 * Helper for API key functions
 * Validates environment variables required for API key functions
 * @param apiKeyName - Name of the API service (smsit, wbiztool, suitedash, stripe)
 * @returns Validated environment configuration
 */
export function validateApiKeyEnv(apiKeyName: string): EdgeFunctionEnv {
  const apiKeyMap: Record<string, keyof EdgeFunctionEnv> = {
    'smsit': 'SMSIT_API_KEY',
    'wbiztool': 'WBIZTOOL_API_KEY',
    'suitedash': 'SUITEDASH_API_KEY',
    'stripe': 'STRIPE_SECRET_KEY'
  };
  
  const apiKey = apiKeyMap[apiKeyName.toLowerCase()];
  const required = apiKey ? [apiKey] : [];
  
  return validateEdgeEnv(required);
}


