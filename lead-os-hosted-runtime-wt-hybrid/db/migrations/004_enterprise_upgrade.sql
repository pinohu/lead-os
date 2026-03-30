-- Enterprise upgrade: audit trail, config changes, TOTP, IP allowlist, session enhancements

CREATE TABLE IF NOT EXISTS lead_os_audit_log (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tenant ON lead_os_audit_log(tenant_id);
CREATE INDEX idx_audit_log_created ON lead_os_audit_log(created_at);
CREATE INDEX idx_audit_log_action ON lead_os_audit_log(action);
CREATE INDEX idx_audit_log_user ON lead_os_audit_log(user_id);

CREATE TABLE IF NOT EXISTS lead_os_config_changes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  config_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_config_changes_tenant ON lead_os_config_changes(tenant_id);
CREATE INDEX idx_config_changes_key ON lead_os_config_changes(config_key);

CREATE TABLE IF NOT EXISTS lead_os_uptime_checks (
  id TEXT PRIMARY KEY,
  component TEXT NOT NULL,
  status TEXT NOT NULL,
  latency_ms INTEGER,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_uptime_checks_component ON lead_os_uptime_checks(component);
CREATE INDEX idx_uptime_checks_checked ON lead_os_uptime_checks(checked_at);
