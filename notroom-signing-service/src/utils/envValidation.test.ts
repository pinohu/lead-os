import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateClientEnv, getEnvConfig, assertClientEnv, getEnv } from './envValidation';

describe('envValidation', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env vars to original state
    Object.assign(import.meta.env, originalEnv);
  });

  afterEach(() => {
    // Restore original env
    Object.assign(import.meta.env, originalEnv);
  });

  describe('validateClientEnv', () => {
    it('should validate required environment variables when all are present', () => {
      // Set required env vars
      import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test-key';
      
      const result = validateClientEnv();
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required variables', () => {
      // Clear required env vars
      import.meta.env.VITE_SUPABASE_URL = '';
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = '';
      
      const result = validateClientEnv();
      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return correct structure', () => {
      const result = validateClientEnv();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('missing');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.missing)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.valid).toBe('boolean');
    });
  });

  describe('assertClientEnv', () => {
    it('should not throw when all required variables are set', () => {
      import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test-key';
      
      expect(() => assertClientEnv()).not.toThrow();
    });

    it('should throw error on missing required variables', () => {
      import.meta.env.VITE_SUPABASE_URL = '';
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = '';
      
      expect(() => assertClientEnv()).toThrow('Missing required environment variables');
    });

    it('should include helpful error message', () => {
      import.meta.env.VITE_SUPABASE_URL = '';
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = '';
      
      try {
        assertClientEnv();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error instanceof Error).toBe(true);
        if (error instanceof Error) {
          expect(error.message).toContain('Missing required');
          expect(error.message).toContain('.env.example');
        }
      }
    });
  });

  describe('getEnvConfig', () => {
    it('should return config object when valid', () => {
      import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test-key';
      
      const config = getEnvConfig();
      expect(config.VITE_SUPABASE_URL).toBe('https://test.supabase.co');
      expect(config.VITE_SUPABASE_PUBLISHABLE_KEY).toBe('test-key');
    });

    it('should include optional variables when set', () => {
      import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test-key';
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
      
      const config = getEnvConfig();
      expect(config.VITE_SENTRY_DSN).toBe('https://test@sentry.io/123');
    });

    it('should throw if required variables are missing', () => {
      import.meta.env.VITE_SUPABASE_URL = '';
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = '';
      
      expect(() => getEnvConfig()).toThrow();
    });
  });

  describe('getEnv', () => {
    it('should return environment variable value', () => {
      import.meta.env.TEST_VAR = 'test-value';
      expect(getEnv('TEST_VAR')).toBe('test-value');
    });

    it('should return fallback when variable not set', () => {
      expect(getEnv('NON_EXISTENT_VAR', 'fallback-value')).toBe('fallback-value');
    });

    it('should throw if variable not set and no fallback', () => {
      expect(() => {
        getEnv('NON_EXISTENT_VAR');
      }).toThrow('Environment variable NON_EXISTENT_VAR is not set');
    });
  });
});


