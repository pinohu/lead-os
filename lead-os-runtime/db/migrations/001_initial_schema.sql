-- 001_initial_schema.sql
-- Lead OS initial database schema
-- Covers core runtime tables and new analytics/scoring/attribution tables

BEGIN;

-- ============================================================================
-- Core runtime tables (mirrors auto-schema in src/lib/runtime-store.ts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_leads (
  lead_key TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS lead_os_events (
  id TEXT PRIMARY KEY,
  lead_key TEXT,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS lead_os_provider_executions (
  id TEXT PRIMARY KEY,
  lead_key TEXT,
  provider TEXT NOT NULL,
  kind TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS lead_os_workflow_runs (
  id TEXT PRIMARY KEY,
  lead_key TEXT,
  event_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS lead_os_booking_jobs (
  id TEXT PRIMARY KEY,
  lead_key TEXT NOT NULL,
  provider TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS lead_os_document_jobs (
  id TEXT PRIMARY KEY,
  lead_key TEXT NOT NULL,
  provider TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS lead_os_workflow_registry (
  slug TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS lead_os_runtime_config (
  key TEXT PRIMARY KEY,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Core runtime indexes
CREATE INDEX IF NOT EXISTS idx_lead_os_events_lead_key_ts
  ON lead_os_events (lead_key, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lead_os_events_event_type
  ON lead_os_events (event_type);
CREATE INDEX IF NOT EXISTS idx_lead_os_provider_executions_lead_key
  ON lead_os_provider_executions (lead_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_os_provider_executions_provider
  ON lead_os_provider_executions (provider);
CREATE INDEX IF NOT EXISTS idx_lead_os_workflow_runs_lead_key
  ON lead_os_workflow_runs (lead_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_os_workflow_runs_event_name
  ON lead_os_workflow_runs (event_name);
CREATE INDEX IF NOT EXISTS idx_lead_os_booking_jobs_lead_key
  ON lead_os_booking_jobs (lead_key);
CREATE INDEX IF NOT EXISTS idx_lead_os_document_jobs_lead_key
  ON lead_os_document_jobs (lead_key);

-- ============================================================================
-- Experiment / A/B testing tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_experiments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_os_experiments_status
  ON lead_os_experiments (status);

CREATE TABLE IF NOT EXISTS lead_os_experiment_assignments (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL REFERENCES lead_os_experiments(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_os_experiment_assignments_experiment
  ON lead_os_experiment_assignments (experiment_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_experiment_assignments_visitor
  ON lead_os_experiment_assignments (visitor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_os_experiment_assignments_unique
  ON lead_os_experiment_assignments (experiment_id, visitor_id);

CREATE TABLE IF NOT EXISTS lead_os_experiment_conversions (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL REFERENCES lead_os_experiments(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  conversion_type TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_os_experiment_conversions_experiment
  ON lead_os_experiment_conversions (experiment_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_experiment_conversions_visitor
  ON lead_os_experiment_conversions (visitor_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_experiment_conversions_type
  ON lead_os_experiment_conversions (conversion_type);

-- ============================================================================
-- Email tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_email_tracking (
  id TEXT PRIMARY KEY,
  lead_key TEXT NOT NULL,
  email_id TEXT NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  link_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_os_email_tracking_lead_key
  ON lead_os_email_tracking (lead_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_os_email_tracking_email_id
  ON lead_os_email_tracking (email_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_email_tracking_event_type
  ON lead_os_email_tracking (event_type);

-- ============================================================================
-- Attribution touches
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_attribution_touches (
  id TEXT PRIMARY KEY,
  lead_key TEXT NOT NULL,
  channel TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  medium TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  landing_page TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_os_attribution_touches_lead_key
  ON lead_os_attribution_touches (lead_key, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_lead_os_attribution_touches_channel
  ON lead_os_attribution_touches (channel);
CREATE INDEX IF NOT EXISTS idx_lead_os_attribution_touches_campaign
  ON lead_os_attribution_touches (campaign);
CREATE INDEX IF NOT EXISTS idx_lead_os_attribution_touches_created_at
  ON lead_os_attribution_touches (created_at);

-- ============================================================================
-- Lead scores
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_lead_scores (
  id TEXT PRIMARY KEY,
  lead_key TEXT NOT NULL REFERENCES lead_os_leads(lead_key) ON DELETE CASCADE,
  score_type TEXT NOT NULL
    CHECK (score_type IN ('intent', 'fit', 'engagement', 'urgency', 'composite')),
  score INTEGER NOT NULL
    CHECK (score BETWEEN 0 AND 100),
  factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_os_lead_scores_lead_key
  ON lead_os_lead_scores (lead_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_os_lead_scores_type
  ON lead_os_lead_scores (score_type);
CREATE INDEX IF NOT EXISTS idx_lead_os_lead_scores_score
  ON lead_os_lead_scores (score DESC);

-- ============================================================================
-- Lead magnets
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_os_lead_magnets (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  delivery_type TEXT NOT NULL DEFAULT '',
  asset_url TEXT NOT NULL DEFAULT '',
  form_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  funnel_family TEXT NOT NULL DEFAULT '',
  niche TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'draft', 'archived')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_os_lead_magnets_slug
  ON lead_os_lead_magnets (slug);
CREATE INDEX IF NOT EXISTS idx_lead_os_lead_magnets_status
  ON lead_os_lead_magnets (status);
CREATE INDEX IF NOT EXISTS idx_lead_os_lead_magnets_niche
  ON lead_os_lead_magnets (niche);
CREATE INDEX IF NOT EXISTS idx_lead_os_lead_magnets_funnel_family
  ON lead_os_lead_magnets (funnel_family);

CREATE TABLE IF NOT EXISTS lead_os_lead_magnet_deliveries (
  id TEXT PRIMARY KEY,
  lead_key TEXT NOT NULL,
  magnet_id TEXT NOT NULL REFERENCES lead_os_lead_magnets(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivered', 'opened', 'failed')),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_os_lead_magnet_deliveries_lead_key
  ON lead_os_lead_magnet_deliveries (lead_key);
CREATE INDEX IF NOT EXISTS idx_lead_os_lead_magnet_deliveries_magnet_id
  ON lead_os_lead_magnet_deliveries (magnet_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_lead_magnet_deliveries_status
  ON lead_os_lead_magnet_deliveries (status);

COMMIT;
