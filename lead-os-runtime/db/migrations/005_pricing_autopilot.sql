-- lead-os-runtime/db/migrations/005_pricing_autopilot.sql
-- Autonomous pricing: SKUs, change audit trail, delayed outcome measurement.
-- Canonical schema uses pricing_outcomes (plural).

CREATE TABLE IF NOT EXISTS pricing_sku (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sku_key TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'USD',
  base_price_cents INTEGER NOT NULL CHECK (base_price_cents > 0),
  current_price_cents INTEGER NOT NULL CHECK (current_price_cents > 0),
  demand_score NUMERIC(7,4) NOT NULL DEFAULT 0.5000
    CHECK (demand_score >= 0 AND demand_score <= 1),
  last_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, sku_key)
);

CREATE TABLE IF NOT EXISTS pricing_change_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sku_key TEXT NOT NULL,
  old_price_cents INTEGER NOT NULL,
  new_price_cents INTEGER NOT NULL,
  reason TEXT NOT NULL,
  policy_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  bullmq_job_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_outcomes (
  id BIGSERIAL PRIMARY KEY,
  change_log_id BIGINT NOT NULL REFERENCES pricing_change_log(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  sku_key TEXT NOT NULL,
  window_hours INTEGER NOT NULL DEFAULT 24,
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'measured', 'failed')),
  measured_at TIMESTAMPTZ,
  metric_conversion_rate_before NUMERIC(10,6),
  metric_conversion_rate_after NUMERIC(10,6),
  revenue_delta_estimate_cents BIGINT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_sku_tenant ON pricing_sku(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pricing_change_tenant_created ON pricing_change_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_outcomes_due ON pricing_outcomes(status, due_at);

INSERT INTO pricing_sku (tenant_id, sku_key, label, base_price_cents, current_price_cents, demand_score)
VALUES ('local-tenant', 'default-seat', 'Default seat', 9900, 9900, 0.5200)
ON CONFLICT (tenant_id, sku_key) DO NOTHING;

INSERT INTO pricing_sku (tenant_id, sku_key, label, base_price_cents, current_price_cents, demand_score)
VALUES ('default-tenant', 'default-seat', 'Default seat', 9900, 9900, 0.5200)
ON CONFLICT (tenant_id, sku_key) DO NOTHING;
