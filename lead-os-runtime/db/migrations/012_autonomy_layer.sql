-- 012_autonomy_layer.sql
-- Controlled autonomy layer storage. Isolated from deterministic core runtime paths.

CREATE TABLE IF NOT EXISTS autonomy_agent_registry (
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_autonomy_agent_registry_tenant_enabled
  ON autonomy_agent_registry (tenant_id, enabled);

CREATE TABLE IF NOT EXISTS agent_decisions (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  decision JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
  reasoning TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent_created
  ON agent_decisions (agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_actions (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  decision_id BIGINT REFERENCES agent_decisions(id) ON DELETE SET NULL,
  action JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL,
  reversible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_actions_agent_created
  ON agent_actions (agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_learning (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  outcome JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_learning_agent_created
  ON agent_learning (agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS autonomy_execution_runs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('shadow', 'active')),
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  decision JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  learning_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_autonomy_execution_runs_tenant_created
  ON autonomy_execution_runs (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS autonomy_agent_audit_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  action_id TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('shadow', 'active')),
  status TEXT NOT NULL CHECK (status IN ('simulated', 'applied', 'replayed', 'blocked', 'failed', 'reverted')),
  decision JSONB NOT NULL DEFAULT '{}'::jsonb,
  action JSONB NOT NULL DEFAULT '{}'::jsonb,
  affected_entities JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_autonomy_agent_audit_tenant_created
  ON autonomy_agent_audit_log (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS autonomy_action_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('shadow', 'active')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  reverse_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('simulated', 'applied', 'replayed', 'blocked', 'failed', 'reverted')),
  reversible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, action_id)
);

CREATE INDEX IF NOT EXISTS idx_autonomy_action_log_tenant_created
  ON autonomy_action_log (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS learning_state (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  outcome JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_state_tenant_created
  ON learning_state (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS node_performance_metrics (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  node_key TEXT NOT NULL,
  success_rate NUMERIC(10,6) NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(10,6) NOT NULL DEFAULT 0,
  engagement_score NUMERIC(10,6) NOT NULL DEFAULT 0,
  failure_pattern TEXT,
  sample_size INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_node_performance_metrics_tenant_node_created
  ON node_performance_metrics (tenant_id, node_key, created_at DESC);

CREATE TABLE IF NOT EXISTS funnel_performance_metrics (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  category TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  conversion_rate NUMERIC(10,6) NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funnel_performance_metrics_tenant_category_created
  ON funnel_performance_metrics (tenant_id, category, created_at DESC);

CREATE TABLE IF NOT EXISTS funnel_variants (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  category TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  conversion_rate NUMERIC(10,6) NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  selection_probability NUMERIC(10,6) NOT NULL DEFAULT 1,
  is_default BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, category, variant_name)
);

CREATE INDEX IF NOT EXISTS idx_funnel_variants_tenant_category
  ON funnel_variants (tenant_id, category, active, is_default DESC, conversion_rate DESC);

CREATE TABLE IF NOT EXISTS autonomy_routing_overrides (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  category TEXT NOT NULL,
  target_node_key TEXT NOT NULL,
  weight NUMERIC(10,6) NOT NULL DEFAULT 1,
  source_action_id TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_autonomy_routing_overrides_tenant_category_active
  ON autonomy_routing_overrides (tenant_id, category, active, updated_at DESC);

CREATE TABLE IF NOT EXISTS autonomy_delivery_overrides (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  category TEXT NOT NULL,
  delivery_channel TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_action_id TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_autonomy_delivery_overrides_tenant_category_active
  ON autonomy_delivery_overrides (tenant_id, category, active, updated_at DESC);

CREATE TABLE IF NOT EXISTS autonomy_follow_up_jobs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  lead_key TEXT NOT NULL,
  follow_up_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_action_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_autonomy_follow_up_jobs_tenant_status_scheduled
  ON autonomy_follow_up_jobs (tenant_id, status, scheduled_for);

INSERT INTO funnel_variants (tenant_id, category, variant_name, conversion_rate, usage_count, selection_probability, is_default, active)
VALUES
  ('default-tenant', 'general', 'default', 0, 0, 1, true, true),
  ('local-tenant', 'general', 'default', 0, 0, 1, true, true)
ON CONFLICT (tenant_id, category, variant_name) DO NOTHING;

INSERT INTO autonomy_agent_registry (tenant_id, agent_id, scope, permissions, enabled)
VALUES
  ('default-tenant', 'routing-agent', 'routing', '["routing_weights","delivery_paths"]'::jsonb, true),
  ('default-tenant', 'pricing-agent', 'pricing', '["routing_weights"]'::jsonb, true),
  ('default-tenant', 'messaging-agent', 'messaging', '["funnel_variants","follow_ups"]'::jsonb, true),
  ('default-tenant', 'gtm-agent', 'gtm', '["funnel_variants","delivery_paths","follow_ups"]'::jsonb, true),
  ('local-tenant', 'routing-agent', 'routing', '["routing_weights","delivery_paths"]'::jsonb, true),
  ('local-tenant', 'pricing-agent', 'pricing', '["routing_weights"]'::jsonb, true),
  ('local-tenant', 'messaging-agent', 'messaging', '["funnel_variants","follow_ups"]'::jsonb, true),
  ('local-tenant', 'gtm-agent', 'gtm', '["funnel_variants","delivery_paths","follow_ups"]'::jsonb, true)
ON CONFLICT (tenant_id, agent_id) DO UPDATE
SET
  scope = EXCLUDED.scope,
  permissions = EXCLUDED.permissions,
  enabled = EXCLUDED.enabled,
  updated_at = NOW();
