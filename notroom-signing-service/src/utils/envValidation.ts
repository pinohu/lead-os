/**
 * Environment variable validation utility
 * Validates required environment variables at runtime
 */

import { logger } from './logger';

interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_PUBLISHABLE_KEY: string;
  VITE_CLOUDFLARE_TURNSTILE_SITE_KEY?: string;
  VITE_SENTRY_DSN?: string;
  VITE_GA_MEASUREMENT_ID?: string;
  VITE_EMAILIT_API_KEY?: string;
  VITE_EMAILIT_API_URL?: string;
}

interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  errors: string[];
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY'
];

const optionalEnvVars: (keyof EnvConfig)[] = [
  'VITE_CLOUDFLARE_TURNSTILE_SITE_KEY',
  'VITE_SENTRY_DSN',
  'VITE_GA_MEASUREMENT_ID',
  'VITE_EMAILIT_API_KEY',
  'VITE_EMAILIT_API_URL'
];

/**
 * Validates required client-side environment variables
 */
export function validateClientEnv(): EnvValidationResult {
  const missing: string[] = [];
  const errors: string[] = [];

  for (const envVar of requiredEnvVars) {
    const value = import.meta.env[envVar];
    if (!value || value.trim() === '') {
      missing.push(envVar);
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Warn about missing optional vars in development
  if (import.meta.env.DEV) {
    for (const envVar of optionalEnvVars) {
      const value = import.meta.env[envVar];
      if (!value || value.trim() === '') {
        logger.warn(`Optional environment variable not set: ${envVar}`);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    errors,
  };
}

/**
 * Validates environment variables and throws if invalid
 * Call this at application startup
 */
export function assertClientEnv(): void {
  const result = validateClientEnv();
  if (!result.valid) {
    const errorMessage = 
      `Missing required environment variables: ${result.missing.join(', ')}\n` +
      `Please check your .env file and ensure all required variables are set.\n` +
      `See .env.example for reference.`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Get validated environment configuration
 * Throws if required variables are missing
 */
export function getEnvConfig(): EnvConfig {
  assertClientEnv();
  
  return {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL!,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
    VITE_CLOUDFLARE_TURNSTILE_SITE_KEY: import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID,
    VITE_EMAILIT_API_KEY: import.meta.env.VITE_EMAILIT_API_KEY,
    VITE_EMAILIT_API_URL: import.meta.env.VITE_EMAILIT_API_URL
  };
}

/**
 * Get environment variable with fallback
 */
export function getEnv(key: string, fallback?: string): string {
  const value = import.meta.env[key];
  if (!value && fallback) {
    return fallback;
  }
  if (!value) {
    throw new Error(`Environment variable ${key} is not set and no fallback provided`);
  }
  return value;
}


