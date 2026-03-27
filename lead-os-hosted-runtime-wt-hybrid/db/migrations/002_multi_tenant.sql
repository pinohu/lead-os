-- Tenant table
CREATE TABLE IF NOT EXISTS lead_os_tenants (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lead_os_tenants_slug ON lead_os_tenants (slug);
CREATE INDEX IF NOT EXISTS idx_lead_os_tenants_status ON lead_os_tenants ((payload->>'status'));

-- Add tenant_id to existing tables (nullable for backwards compat)
ALTER TABLE lead_os_leads ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default-tenant';
ALTER TABLE lead_os_events ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default-tenant';
ALTER TABLE lead_os_provider_executions ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default-tenant';
ALTER TABLE lead_os_workflow_runs ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default-tenant';
ALTER TABLE lead_os_booking_jobs ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default-tenant';
ALTER TABLE lead_os_document_jobs ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default-tenant';
ALTER TABLE lead_os_workflow_registry ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default-tenant';
ALTER TABLE lead_os_runtime_config ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default-tenant';

-- Indexes on tenant_id
CREATE INDEX IF NOT EXISTS idx_lead_os_leads_tenant ON lead_os_leads (tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_events_tenant ON lead_os_events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_provider_executions_tenant ON lead_os_provider_executions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_workflow_runs_tenant ON lead_os_workflow_runs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_booking_jobs_tenant ON lead_os_booking_jobs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_document_jobs_tenant ON lead_os_document_jobs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_workflow_registry_tenant ON lead_os_workflow_registry (tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_os_runtime_config_tenant ON lead_os_runtime_config (tenant_id);

-- Billing tables
CREATE TABLE IF NOT EXISTS lead_os_subscriptions (
  tenant_id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS lead_os_usage (
  tenant_id TEXT NOT NULL,
  period TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL,
  PRIMARY KEY (tenant_id, period)
);

-- Marketplace tables
CREATE TABLE IF NOT EXISTS lead_os_marketplace_leads (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  niche TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_marketplace_leads_niche ON lead_os_marketplace_leads (niche);
CREATE INDEX IF NOT EXISTS idx_marketplace_leads_tenant ON lead_os_marketplace_leads (tenant_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_leads_status ON lead_os_marketplace_leads ((payload->>'status'));

CREATE TABLE IF NOT EXISTS lead_os_marketplace_buyers (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);
