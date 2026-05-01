CREATE TABLE IF NOT EXISTS lead_os_package_provisioning (
  tenant_id TEXT NOT NULL,
  launch_id TEXT NOT NULL,
  package_slug TEXT NOT NULL,
  package_title TEXT NOT NULL,
  workspace_slug TEXT NOT NULL,
  status TEXT NOT NULL,
  operator_email TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  customer JSONB NOT NULL,
  urls JSONB NOT NULL,
  embed JSONB NOT NULL,
  credentials JSONB NOT NULL,
  artifacts JSONB NOT NULL,
  automation_runs JSONB NOT NULL,
  acceptance_tests JSONB NOT NULL,
  payload JSONB NOT NULL,
  launched_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, launch_id)
);

CREATE INDEX IF NOT EXISTS lead_os_package_provisioning_tenant_updated_idx
  ON lead_os_package_provisioning (tenant_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS lead_os_package_provisioning_tenant_workspace_idx
  ON lead_os_package_provisioning (tenant_id, workspace_slug);

ALTER TABLE lead_os_package_provisioning ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lead_os_package_provisioning_tenant_isolation
  ON lead_os_package_provisioning;

CREATE POLICY lead_os_package_provisioning_tenant_isolation
  ON lead_os_package_provisioning
  USING (tenant_id = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));
