-- 010_erie_directory_seed.sql
-- Erie.pro directory demo: tenant row, pricing nodes, entitlements, routing audit table.

CREATE TABLE IF NOT EXISTS lead_os_directory_routes (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  lead_key TEXT NOT NULL,
  category TEXT NOT NULL,
  node_key TEXT NOT NULL,
  delivery_channel TEXT NOT NULL,
  outcome TEXT NOT NULL DEFAULT 'pending',
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_os_directory_routes_tenant_created
  ON lead_os_directory_routes (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_os_directory_routes_lead
  ON lead_os_directory_routes (tenant_id, lead_key);

-- Erie.pro tenant (directory use case)
INSERT INTO lead_os_tenants (id, slug, created_at, updated_at, payload)
VALUES (
  'erie',
  'erie',
  NOW(),
  NOW(),
  '{
    "brandName": "Erie.pro",
    "siteUrl": "https://erie.pro",
    "supportEmail": "hello@erie.pro",
    "defaultService": "directory",
    "defaultNiche": "plumbing",
    "widgetOrigins": ["https://erie.pro", "http://localhost:3000"],
    "accent": "#0369a1",
    "enabledFunnels": ["lead-magnet", "qualification"],
    "channels": {"email": true, "whatsapp": false, "sms": false, "chat": false, "voice": false},
    "revenueModel": "directory",
    "plan": "enterprise",
    "stripeCustomerId": "",
    "stripeSubscriptionId": "",
    "status": "active",
    "operatorEmails": [],
    "providerConfig": {},
    "metadata": {"product": "erie-local-directory"}
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  payload = EXCLUDED.payload,
  updated_at = NOW();

INSERT INTO nodes (tenant_id, node_key, sku_key, status, metadata, created_at, updated_at)
VALUES
  ('erie', 'plumber_erie_test_1', 'plumbing_sku', 'active', '{"category":"plumbing","label":"Erie plumbing test node"}'::jsonb, NOW(), NOW()),
  ('erie', 'hvac_erie_test_1', 'hvac_sku', 'active', '{"category":"hvac","label":"Erie HVAC test node"}'::jsonb, NOW(), NOW())
ON CONFLICT (tenant_id, node_key) DO UPDATE SET
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

INSERT INTO billing_subscriptions (tenant_id, plan_key, status, current_period_end, updated_at)
VALUES ('erie', 'enterprise', 'active', NOW() + INTERVAL '365 days', NOW())
ON CONFLICT (tenant_id) DO UPDATE SET
  plan_key = EXCLUDED.plan_key,
  status = EXCLUDED.status,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW();
