-- 007_billing_entitlements_audit.sql
-- SaaS plans/subscriptions, operator audit trail.

CREATE TABLE IF NOT EXISTS billing_plans (
  plan_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  max_nodes INTEGER NOT NULL DEFAULT 50,
  pricing_execution_allowed BOOLEAN NOT NULL DEFAULT true,
  api_access_tier TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  tenant_id TEXT PRIMARY KEY,
  plan_key TEXT NOT NULL REFERENCES billing_plans(plan_key) ON UPDATE CASCADE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_status ON billing_subscriptions(status);

CREATE TABLE IF NOT EXISTS operator_audit_log (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_email TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_operator_audit_tenant_created ON operator_audit_log(tenant_id, created_at DESC);

INSERT INTO billing_plans (plan_key, display_name, max_nodes, pricing_execution_allowed, api_access_tier)
VALUES
  ('developer', 'Developer', 500, true, 'full'),
  ('growth', 'Growth', 25, true, 'standard'),
  ('enterprise', 'Enterprise', 999999, true, 'full')
ON CONFLICT (plan_key) DO NOTHING;

INSERT INTO billing_subscriptions (tenant_id, plan_key, status, current_period_end)
VALUES
  ('default-tenant', 'enterprise', 'active', NOW() + INTERVAL '365 days'),
  ('local-tenant', 'enterprise', 'active', NOW() + INTERVAL '365 days')
ON CONFLICT (tenant_id) DO NOTHING;
