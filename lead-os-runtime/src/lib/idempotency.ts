// src/lib/idempotency.ts
// Cross-request idempotency for operator mutations (Postgres-backed).

import { createHash } from "crypto";
import { queryPostgres } from "@/lib/db";

export type IdempotencyLookupResult =
  | { kind: "miss" }
  | { kind: "hit"; statusCode: number; body: unknown }
  | { kind: "mismatch" };

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function lookupIdempotency(input: {
  scope: string;
  idempotencyKey: string;
  actorFingerprint: string;
  payloadHash: string;
}): Promise<IdempotencyLookupResult> {
  try {
    const res = await queryPostgres<{
      status_code: number;
      response_json: unknown;
      payload_hash: string;
    }>(
      `SELECT status_code, response_json, payload_hash
         FROM idempotency_records
        WHERE scope = $1 AND idempotency_key = $2 AND actor_fingerprint = $3
        LIMIT 1`,
      [input.scope, input.idempotencyKey, input.actorFingerprint],
    );
    const row = res.rows[0];
    if (!row) return { kind: "miss" };
    if (row.payload_hash !== input.payloadHash) {
      return { kind: "mismatch" };
    }
    return { kind: "hit", statusCode: row.status_code, body: row.response_json };
  } catch {
    return { kind: "miss" };
  }
}

export async function storeIdempotency(input: {
  scope: string;
  idempotencyKey: string;
  actorFingerprint: string;
  payloadHash: string;
  statusCode: number;
  responseBody: unknown;
}): Promise<void> {
  try {
    await queryPostgres(
      `INSERT INTO idempotency_records
        (scope, idempotency_key, actor_fingerprint, payload_hash, status_code, response_json)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        input.scope,
        input.idempotencyKey,
        input.actorFingerprint,
        input.payloadHash,
        input.statusCode,
        JSON.stringify(input.responseBody ?? {}),
      ],
    );
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
    if (code !== "23505") throw err;
  }
}

export function hashPayloadJson(body: unknown): string {
  return sha256(JSON.stringify(body ?? {}));
}
