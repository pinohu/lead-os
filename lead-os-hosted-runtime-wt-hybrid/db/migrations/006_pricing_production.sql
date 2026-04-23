-- lead-os-hosted-runtime-wt-hybrid/db/migrations/006_pricing_production.sql
-- Nodes registry, pricing_history, pricing_outcomes rename, recommendations, persisted DLQ.

CREATE TABLE IF NOT EXISTS nodes (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  node_key TEXT NOT NULL,
  sku_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'disabled')),
  learning_bias NUMERIC(10,6) NOT NULL DEFAULT 0,
  last_scan_at TIMESTAMPTZ,
  last_applied_price_cents INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, node_key)
);

CREATE INDEX IF NOT EXISTS idx_nodes_tenant_status ON nodes(tenant_id, status);

CREATE TABLE IF NOT EXISTS pricing_history (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sku_key TEXT NOT NULL,
  node_id BIGINT REFERENCES nodes(id) ON DELETE SET NULL,
  old_price_cents INTEGER NOT NULL,
  new_price_cents INTEGER NOT NULL,
  applied BOOLEAN NOT NULL DEFAULT true,
  reason TEXT NOT NULL,
  simulation JSONB NOT NULL DEFAULT '{}'::jsonb,
  policy_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  change_log_id BIGINT REFERENCES pricing_change_log(id) ON DELETE SET NULL,
  bullmq_job_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_history_tenant_created ON pricing_history(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS pricing_recommendations (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sku_key TEXT NOT NULL,
  node_id BIGINT REFERENCES nodes(id) ON DELETE SET NULL,
  recommended_price_cents INTEGER NOT NULL,
  simulated_lift NUMERIC(12,8),
  confidence NUMERIC(6,4) NOT NULL DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'applied', 'rejected', 'expired')),
  policy_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  applied_history_id BIGINT REFERENCES pricing_history(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_reco_tenant_status ON pricing_recommendations(tenant_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS dead_letter_jobs (
  id BIGSERIAL PRIMARY KEY,
  source_queue TEXT NOT NULL,
  job_name TEXT NOT NULL,
  job_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dead_letter_created ON dead_letter_jobs(created_at DESC);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pricing_outcome'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pricing_outcomes'
  ) THEN
    ALTER TABLE pricing_outcome RENAME TO pricing_outcomes;
  END IF;
END $$;

INSERT INTO nodes (tenant_id, node_key, sku_key, last_applied_price_cents, status)
SELECT ps.tenant_id, ps.sku_key, ps.sku_key, ps.current_price_cents, 'active'
FROM pricing_sku ps
ON CONFLICT (tenant_id, node_key) DO NOTHING;
