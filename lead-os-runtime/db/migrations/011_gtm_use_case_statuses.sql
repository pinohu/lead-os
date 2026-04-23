-- GTM use case operational status (per deployment tenant).
CREATE TABLE IF NOT EXISTS gtm_use_case_statuses (
  tenant_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'live', 'paused')),
  notes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  PRIMARY KEY (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_gtm_use_case_statuses_tenant_updated
  ON gtm_use_case_statuses (tenant_id, updated_at DESC);
