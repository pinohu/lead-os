/**
 * Central test cleanup utilities for shared-process test isolation.
 *
 * With --test-isolation=none, all test files share a single process.
 * Module-level Maps and arrays persist across files. This module provides:
 *
 * 1. A reset registry so stores can be cleared in one call.
 * 2. A safe environment variable override that guarantees restoration
 *    even if the test throws before cleanup.
 *
 * Each test file registers its own reset functions via registerReset().
 * This avoids importing all store modules eagerly (which can trigger
 * unsupported TypeScript features in transitive deps).
 */

// ---------------------------------------------------------------------------
// Store reset registry
// ---------------------------------------------------------------------------

const resetFunctions: Array<() => void | Promise<void>> = [];
const registeredNames = new Set<string>();

/**
 * Register a store's reset function. Call with a unique name to prevent
 * duplicate registrations (safe to call from multiple test files that
 * import the same store).
 */
export function registerReset(name: string, fn: () => void | Promise<void>): void {
  if (registeredNames.has(name)) return;
  registeredNames.add(name);
  resetFunctions.push(fn);
}

/**
 * Reset every registered store. Call this in beforeEach to guarantee
 * complete isolation between tests when running in a shared process.
 */
export async function resetAllStores(): Promise<void> {
  for (const fn of resetFunctions) {
    await fn();
  }
}

// ---------------------------------------------------------------------------
// Safe environment variable override
// ---------------------------------------------------------------------------

/**
 * Temporarily override environment variables for a test. Returns a restore
 * function that puts everything back. Use in afterEach or a finally block.
 *
 * Pass `undefined` as a value to delete the variable for the test duration.
 *
 * @example
 * ```ts
 * const restore = withEnv({ AI_API_KEY: "test-key", AI_PROVIDER: undefined });
 * try {
 *   // test code that reads process.env.AI_API_KEY
 * } finally {
 *   restore();
 * }
 * ```
 */
export function withEnv(overrides: Record<string, string | undefined>): () => void {
  const originals: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(overrides)) {
    originals[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  return () => {
    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}
