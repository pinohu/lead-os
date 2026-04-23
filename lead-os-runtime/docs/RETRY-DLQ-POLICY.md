# Retry and DLQ policy (pricing)

## BullMQ

- Main and measure queues use **exponential backoff** (see `src/lib/pricing/queue-client.ts`).
- **Max attempts:** 5 by default (`PRICING_DEFAULT_MAX_ATTEMPTS` in `retry-policy.ts`).
- After the final failure, jobs are forwarded to **persisted Postgres** `dead_letter_jobs` and optionally the BullMQ DLQ queue.

## Idempotency

- **Operator actions** (`POST /api/operator/actions`) accept `Idempotency-Key` (or `idempotency-key`). The same key + actor + payload hash returns the **stored prior response** without re-executing the mutation (`idempotency_records` table, migration `008`).
- **DLQ replay** uses deterministic BullMQ `jobId` patterns where possible to avoid duplicate side effects when operators double-click.

## Classification

- `retry-policy.ts` lists **message markers** treated as likely **non-retryable** for tuning and observability (not automatically wired to BullMQ `attempts` per job type — BullMQ still retries until max attempts unless job options change).

## Operations

- Monitor DLQ growth via `/api/health/deep` and control plane; set `LEAD_OS_DLQ_ALERT_THRESHOLD` to surface `alerts` in deep health when persisted DLQ rows exceed the threshold.
