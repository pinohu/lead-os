-- 003_additional_tables.sql
-- Additional tables required by Lead OS runtime modules.
-- All CREATE TABLE / CREATE INDEX statements are idempotent (IF NOT EXISTS).

BEGIN;

-- ============================================================================
-- Auth system tables (src/lib/auth-system.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_os_users_email_tenant
  ON lead_os_users (email, tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_users_tenant
  ON lead_os_users (tenant_id);

CREATE TABLE IF NOT EXISTS lead_os_api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES lead_os_users(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_lead_os_api_keys_prefix
  ON lead_os_api_keys (prefix);
CREATE INDEX IF NOT EXISTS idx_lead_os_api_keys_user
  ON lead_os_api_keys (user_id);

CREATE TABLE IF NOT EXISTS lead_os_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES lead_os_users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  role TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_os_sessions_user
  ON lead_os_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_sessions_tenant
  ON lead_os_sessions (tenant_id);

CREATE TABLE IF NOT EXISTS lead_os_invites (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  role TEXT NOT NULL,
  invited_by TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_os_invites_tenant
  ON lead_os_invites (tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_invites_email
  ON lead_os_invites (email);

-- ============================================================================
-- Adaptive loop tables (src/lib/adaptive-loop.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_adaptive_loop_state (
  tenant_id TEXT PRIMARY KEY,
  cycle_count INT NOT NULL DEFAULT 0,
  last_observation JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_evaluation JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_adjustment JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_deployment JSONB NOT NULL DEFAULT '{}'::jsonb,
  health TEXT NOT NULL DEFAULT 'healthy',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_os_adaptive_loop_history (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  cycle_count INT NOT NULL,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_adaptive_loop_history_tenant
  ON lead_os_adaptive_loop_history (tenant_id, created_at DESC);

-- ============================================================================
-- Analytics snapshots (src/lib/data-pipeline.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_analytics_snapshots (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  period TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_os_analytics_snapshots_unique
  ON lead_os_analytics_snapshots (tenant_id, period);
CREATE INDEX IF NOT EXISTS idx_lead_os_analytics_snapshots_tenant
  ON lead_os_analytics_snapshots (tenant_id, period);

-- ============================================================================
-- Distribution engine tables (src/lib/distribution-engine.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_blog_outlines (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  niche TEXT NOT NULL,
  topic TEXT NOT NULL,
  target_keyword TEXT NOT NULL,
  headings JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_word_count INTEGER NOT NULL DEFAULT 1500,
  internal_link_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_os_blog_outlines_tenant
  ON lead_os_blog_outlines (tenant_id);

CREATE TABLE IF NOT EXISTS lead_os_content_schedules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  title TEXT NOT NULL,
  publish_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_os_content_schedules_tenant
  ON lead_os_content_schedules (tenant_id, status);

CREATE TABLE IF NOT EXISTS lead_os_distribution_metrics (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  metric TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_os_distribution_metrics_tenant
  ON lead_os_distribution_metrics (tenant_id, channel, recorded_at);

-- ============================================================================
-- Creative scheduler tables (src/lib/creative-scheduler.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_creative_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  schedule TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_output JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_os_creative_jobs_tenant
  ON lead_os_creative_jobs (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_os_creative_jobs_schedule
  ON lead_os_creative_jobs (schedule, status, next_run_at);

CREATE TABLE IF NOT EXISTS lead_os_creative_outputs (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES lead_os_creative_jobs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  artifacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_os_creative_outputs_job
  ON lead_os_creative_outputs (job_id, generated_at DESC);

-- ============================================================================
-- GDPR deletion requests (src/lib/gdpr.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_deletion_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  lead_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  tables_processed JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lead_os_deletion_requests_tenant
  ON lead_os_deletion_requests (tenant_id, created_at DESC);

-- ============================================================================
-- Design specs (src/lib/design-spec-store.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_design_specs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'applied', 'archived')),
  spec JSONB NOT NULL DEFAULT '{}'::jsonb,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_design_specs_tenant
  ON lead_os_design_specs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_design_specs_status
  ON lead_os_design_specs (tenant_id, status);

-- ============================================================================
-- Email suppressions (src/lib/email-sender.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_email_suppressions (
  email TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (email, tenant_id)
);
CREATE INDEX IF NOT EXISTS idx_suppressions_tenant
  ON lead_os_email_suppressions (tenant_id);

-- ============================================================================
-- Escalation tables (src/lib/escalation-engine.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_escalations (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT NOT NULL,
  assigned_rep_id TEXT,
  estimated_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in-progress', 'resolved', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_escalations_tenant
  ON lead_os_escalations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status
  ON lead_os_escalations (status);
CREATE INDEX IF NOT EXISTS idx_escalations_lead
  ON lead_os_escalations (lead_id);

CREATE TABLE IF NOT EXISTS lead_os_escalation_outcomes (
  escalation_id TEXT PRIMARY KEY,
  outcome TEXT NOT NULL,
  deal_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Export jobs (src/lib/data-pipeline.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_export_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  format TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  row_count INTEGER,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  export_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lead_os_export_jobs_tenant
  ON lead_os_export_jobs (tenant_id, created_at DESC);

-- ============================================================================
-- Feedback cycles (src/lib/feedback-engine.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_feedback_cycles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  period TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  adjustments JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lead_os_feedback_cycles_tenant
  ON lead_os_feedback_cycles (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_os_feedback_cycles_type
  ON lead_os_feedback_cycles (tenant_id, type);

-- ============================================================================
-- Ingress tables (src/lib/ingress-engine.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_ingress_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  intent_level TEXT NOT NULL,
  funnel_type TEXT NOT NULL,
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
  initial_score_boost INTEGER NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_os_ingress_rules_tenant
  ON lead_os_ingress_rules (tenant_id, priority DESC);

CREATE TABLE IF NOT EXISTS lead_os_ingress_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  lead_key TEXT,
  score_boost INTEGER NOT NULL DEFAULT 0,
  converted BOOLEAN NOT NULL DEFAULT false,
  lead_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_os_ingress_events_tenant
  ON lead_os_ingress_events (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_os_ingress_events_channel
  ON lead_os_ingress_events (tenant_id, channel);

-- ============================================================================
-- Marketplace supply/demand (src/lib/marketplace-growth.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_marketplace_supply_demand (
  niche TEXT PRIMARY KEY,
  supply INTEGER NOT NULL DEFAULT 0,
  demand INTEGER NOT NULL DEFAULT 0,
  avg_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Pipeline runs (src/lib/revenue-pipeline.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_pipeline_runs (
  id TEXT PRIMARY KEY,
  lead_key TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  niche TEXT NOT NULL,
  route TEXT NOT NULL DEFAULT '',
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_duration_ms INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_tenant
  ON lead_os_pipeline_runs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_lead_key
  ON lead_os_pipeline_runs (lead_key);

-- ============================================================================
-- Product events (src/lib/product-analytics.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_product_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  event TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_os_product_events_tenant
  ON lead_os_product_events (tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lead_os_product_events_event
  ON lead_os_product_events (event, timestamp DESC);

-- ============================================================================
-- Programmatic / SEO pages (src/lib/distribution-engine.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_programmatic_pages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  niche TEXT NOT NULL,
  location TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  h1 TEXT NOT NULL,
  body_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  schema_markup JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_os_programmatic_pages_tenant
  ON lead_os_programmatic_pages (tenant_id);

-- ============================================================================
-- Revenue events (src/lib/monetization-engine.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_revenue_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_revenue_events_tenant
  ON lead_os_revenue_events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_source
  ON lead_os_revenue_events (source);

-- ============================================================================
-- SEO pages (src/lib/distribution-engine.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_seo_pages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  niche TEXT NOT NULL,
  keyword TEXT NOT NULL,
  template TEXT NOT NULL DEFAULT 'standard',
  title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  h1 TEXT NOT NULL,
  body_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  schema_markup JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_os_seo_pages_tenant
  ON lead_os_seo_pages (tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_seo_pages_keyword
  ON lead_os_seo_pages (keyword);

-- ============================================================================
-- Sessions — visitor sessions (src/lib/visitor-tracking.ts)
-- (lead_os_sessions above is for auth; this is the visitor session table)
-- ============================================================================

-- Note: lead_os_sessions is already created above (auth sessions).
-- Visitor-level sessions are stored in lead_os_events / lead_os_leads.
-- No separate visitor session table is declared in visitor-tracking.ts;
-- the module uses the existing in-memory Map backed by lead_os_events.

-- ============================================================================
-- Social posts (src/lib/distribution-engine.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_social_posts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  character_limit INTEGER NOT NULL,
  source_content_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_os_social_posts_tenant
  ON lead_os_social_posts (tenant_id);

-- ============================================================================
-- Strategy decisions (src/lib/strategy-engine.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_strategy_decisions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  rationale TEXT NOT NULL,
  expected_impact JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected', 'implemented')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_strategy_decisions_tenant
  ON lead_os_strategy_decisions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_strategy_decisions_status
  ON lead_os_strategy_decisions (status);

-- ============================================================================
-- Webhook tables (src/lib/webhook-registry.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_webhook_endpoints (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  url TEXT NOT NULL,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  secret TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_os_webhook_endpoints_tenant
  ON lead_os_webhook_endpoints (tenant_id);

CREATE TABLE IF NOT EXISTS lead_os_webhook_deliveries (
  id TEXT PRIMARY KEY,
  endpoint_id TEXT NOT NULL REFERENCES lead_os_webhook_endpoints(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  http_status INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 6,
  next_retry_at TIMESTAMPTZ,
  response_body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lead_os_webhook_deliveries_endpoint
  ON lead_os_webhook_deliveries (endpoint_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_os_webhook_deliveries_retry
  ON lead_os_webhook_deliveries (status, next_retry_at)
  WHERE status = 'retrying';

COMMIT;
