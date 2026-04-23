-- 008_idempotency_records.sql
-- Idempotency for operator and other safe retries (24h uniqueness window via cleanup job or TTL policy).

CREATE TABLE IF NOT EXISTS idempotency_records (
  id BIGSERIAL PRIMARY KEY,
  scope TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  actor_fingerprint TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  status_code INT NOT NULL,
  response_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scope, idempotency_key, actor_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_scope_created ON idempotency_records (scope, created_at DESC);
