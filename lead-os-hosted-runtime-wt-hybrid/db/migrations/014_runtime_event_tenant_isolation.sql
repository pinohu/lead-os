ALTER TABLE lead_os_events
  ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default-tenant';

UPDATE lead_os_events
SET tenant_id = COALESCE(payload->>'tenant', tenant_id, 'default-tenant')
WHERE tenant_id IS NULL OR tenant_id = 'default-tenant';

ALTER TABLE lead_os_events
  ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_os_events_tenant_timestamp
  ON lead_os_events (tenant_id, timestamp DESC);

ALTER TABLE lead_os_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lead_os_events_tenant_isolation
  ON lead_os_events;

CREATE POLICY lead_os_events_tenant_isolation
  ON lead_os_events
  USING (tenant_id = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));
