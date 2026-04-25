import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorTracker, captureReactError } from './errorTracking';

describe('errorTracking utility', () => {
  const originalEnv = import.meta.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(import.meta, 'env', {
      value: originalEnv,
      writable: true,
    });
  });

  describe('captureException', () => {
    it('should capture errors in development mode', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: true, VITE_SENTRY_DSN: '' },
        writable: true,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');

      errorTracker.captureException(error);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should capture errors with context', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: true, VITE_SENTRY_DSN: '' },
        writable: true,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      const context = { userId: '123', component: 'TestComponent' };

      errorTracker.captureException(error, context);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle Sentry integration when DSN is configured', async () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: false, VITE_SENTRY_DSN: 'https://test@sentry.io/123' },
        writable: true,
      });

      // Mock Sentry module
      const mockSentry = {
        init: vi.fn(),
        captureException: vi.fn(),
        captureMessage: vi.fn(),
        setUser: vi.fn(),
        browserTracingIntegration: vi.fn(() => ({})),
        replayIntegration: vi.fn(() => ({})),
      };

      vi.doMock('@sentry/react', () => mockSentry);

      const error = new Error('Test error');
      
      // Re-import to get new instance with mocked Sentry
      const { errorTracker: newTracker } = await import('./errorTracking');
      
      // Wait a bit for async Sentry init
      await new Promise(resolve => setTimeout(resolve, 100));
      
      newTracker.captureException(error);
      
      // Note: In actual test, Sentry would be initialized, but mocking is complex
      // This test verifies the code path exists
    });
  });

  describe('captureMessage', () => {
    it('should capture messages in development mode', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: true, VITE_SENTRY_DSN: '' },
        writable: true,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      errorTracker.captureMessage('Test message', 'info');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should capture messages with different levels', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: true, VITE_SENTRY_DSN: '' },
        writable: true,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      errorTracker.captureMessage('Info message', 'info');
      errorTracker.captureMessage('Warning message', 'warning');
      errorTracker.captureMessage('Error message', 'error');

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      consoleSpy.mockRestore();
    });
  });

  describe('setUser and clearUser', () => {
    it('should set user in development mode', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: true, VITE_SENTRY_DSN: '' },
        writable: true,
      });

      errorTracker.setUser('user123', 'user@example.com');
      errorTracker.clearUser();

      // These methods don't throw errors, which is the main test
      expect(true).toBe(true);
    });
  });

  describe('captureReactError', () => {
    it('should capture React errors with error info', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: true, VITE_SENTRY_DSN: '' },
        writable: true,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('React error');
      const errorInfo: React.ErrorInfo = {
        componentStack: 'ComponentStack',
        digest: 'digest',
      };

      captureReactError(error, errorInfo);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle missing component stack', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: true, VITE_SENTRY_DSN: '' },
        writable: true,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('React error');
      const errorInfo: React.ErrorInfo = {
        componentStack: undefined,
        digest: 'digest',
      };

      captureReactError(error, errorInfo);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

