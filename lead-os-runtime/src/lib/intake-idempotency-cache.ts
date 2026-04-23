// src/lib/intake-idempotency-cache.ts
// Short-lived idempotency cache for POST /api/intake when Idempotency-Key is sent.
// Stores both payload hash and response so we can return 409 on key reuse with
// a different payload body.

const TTL_MS = 10 * 60 * 1000

interface IntakeIdempotencyRow {
  expires: number
  payloadHash: string
  responseJson: string
}

const store = new Map<string, IntakeIdempotencyRow>()

export type IntakeIdempotencyLookupResult =
  | { kind: "miss" }
  | { kind: "hit"; responseJson: string }
  | { kind: "mismatch" }

export function lookupIntakeIdempotency(
  key: string,
  payloadHash: string,
): IntakeIdempotencyLookupResult {
  const row = store.get(key)
  if (!row) return { kind: "miss" }
  if (Date.now() > row.expires) {
    store.delete(key)
    return { kind: "miss" }
  }
  if (row.payloadHash !== payloadHash) return { kind: "mismatch" }
  return { kind: "hit", responseJson: row.responseJson }
}

export function storeIntakeIdempotency(
  key: string,
  payloadHash: string,
  responseJson: string,
): void {
  store.set(key, {
    expires: Date.now() + TTL_MS,
    payloadHash,
    responseJson,
  })
}

export function resetIntakeIdempotencyCache(): void {
  store.clear()
}
