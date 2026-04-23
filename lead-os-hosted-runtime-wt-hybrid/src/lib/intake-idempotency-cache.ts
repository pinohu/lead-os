// src/lib/intake-idempotency-cache.ts
// Short-lived response cache for POST /api/intake when Idempotency-Key is sent (single-instance).

const TTL_MS = 10 * 60 * 1000;
const store = new Map<string, { expires: number; bodyJson: string }>();

export function getIntakeIdempotentResponse(key: string): string | null {
  const row = store.get(key);
  if (!row) return null;
  if (Date.now() > row.expires) {
    store.delete(key);
    return null;
  }
  return row.bodyJson;
}

export function setIntakeIdempotentResponse(key: string, bodyJson: string): void {
  store.set(key, { expires: Date.now() + TTL_MS, bodyJson });
}
