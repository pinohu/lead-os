-- Align legacy JSON-first tables with production code paths that query typed columns.

ALTER TABLE lead_os_subscriptions ADD COLUMN IF NOT EXISTS plan_id TEXT;
ALTER TABLE lead_os_subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE lead_os_subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE lead_os_subscriptions ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE lead_os_subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE lead_os_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE lead_os_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN;

UPDATE lead_os_subscriptions
SET
  plan_id = COALESCE(plan_id, payload->>'planId', payload->>'plan_id', 'managed-growth'),
  stripe_customer_id = COALESCE(stripe_customer_id, payload->>'stripeCustomerId', payload->>'stripe_customer_id', ''),
  stripe_subscription_id = COALESCE(stripe_subscription_id, payload->>'stripeSubscriptionId', payload->>'stripe_subscription_id', ''),
  status = COALESCE(status, payload->>'status', 'active'),
  current_period_start = COALESCE(current_period_start, (payload->>'currentPeriodStart')::timestamptz, created_at, NOW()),
  current_period_end = COALESCE(current_period_end, (payload->>'currentPeriodEnd')::timestamptz, NOW()),
  cancel_at_period_end = COALESCE(cancel_at_period_end, (payload->>'cancelAtPeriodEnd')::boolean, false);

ALTER TABLE lead_os_subscriptions ALTER COLUMN plan_id SET NOT NULL;
ALTER TABLE lead_os_subscriptions ALTER COLUMN stripe_customer_id SET NOT NULL;
ALTER TABLE lead_os_subscriptions ALTER COLUMN stripe_subscription_id SET NOT NULL;
ALTER TABLE lead_os_subscriptions ALTER COLUMN status SET NOT NULL;
ALTER TABLE lead_os_subscriptions ALTER COLUMN current_period_start SET NOT NULL;
ALTER TABLE lead_os_subscriptions ALTER COLUMN current_period_end SET NOT NULL;
ALTER TABLE lead_os_subscriptions ALTER COLUMN cancel_at_period_end SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_os_subscriptions_status ON lead_os_subscriptions (status);

ALTER TABLE lead_os_usage ADD COLUMN IF NOT EXISTS leads INT;
ALTER TABLE lead_os_usage ADD COLUMN IF NOT EXISTS emails INT;
ALTER TABLE lead_os_usage ADD COLUMN IF NOT EXISTS sms INT;
ALTER TABLE lead_os_usage ADD COLUMN IF NOT EXISTS whatsapp INT;

UPDATE lead_os_usage
SET
  leads = COALESCE(leads, (payload->>'leads')::int, 0),
  emails = COALESCE(emails, (payload->>'emails')::int, 0),
  sms = COALESCE(sms, (payload->>'sms')::int, 0),
  whatsapp = COALESCE(whatsapp, (payload->>'whatsapp')::int, 0);

ALTER TABLE lead_os_usage ALTER COLUMN leads SET NOT NULL;
ALTER TABLE lead_os_usage ALTER COLUMN emails SET NOT NULL;
ALTER TABLE lead_os_usage ALTER COLUMN sms SET NOT NULL;
ALTER TABLE lead_os_usage ALTER COLUMN whatsapp SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_os_usage_period ON lead_os_usage (period);

ALTER TABLE lead_os_leads ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE lead_os_leads ADD COLUMN IF NOT EXISTS score INT;
ALTER TABLE lead_os_leads ADD COLUMN IF NOT EXISTS niche TEXT;
ALTER TABLE lead_os_leads ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE lead_os_leads ADD COLUMN IF NOT EXISTS tenant_id TEXT;

UPDATE lead_os_leads
SET
  tenant_id = COALESCE(tenant_id, payload->'trace'->>'tenant', payload->>'tenantId', 'default-tenant'),
  status = COALESCE(status, payload->>'status', 'new'),
  score = COALESCE(score, (payload->>'score')::int, 0),
  niche = COALESCE(niche, payload->>'niche', 'unknown'),
  source = COALESCE(source, payload->>'source', payload->'trace'->>'source', 'unknown');

ALTER TABLE lead_os_leads ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE lead_os_leads ALTER COLUMN status SET NOT NULL;
ALTER TABLE lead_os_leads ALTER COLUMN score SET NOT NULL;
ALTER TABLE lead_os_leads ALTER COLUMN niche SET NOT NULL;
ALTER TABLE lead_os_leads ALTER COLUMN source SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_os_leads_tenant_status ON lead_os_leads (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_os_leads_tenant_score ON lead_os_leads (tenant_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_os_leads_tenant_niche ON lead_os_leads (tenant_id, niche);
