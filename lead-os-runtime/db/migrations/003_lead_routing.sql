-- db/migrations/003_lead_routing.sql
CREATE TABLE IF NOT EXISTS lead_assignments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id),
  node_id INTEGER NOT NULL REFERENCES nodes(id),
  status TEXT NOT NULL DEFAULT 'assigned',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead_id ON lead_assignments (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_node_id ON lead_assignments (node_id);

CREATE TABLE IF NOT EXISTS delivery_logs (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL,
  node_id INTEGER NOT NULL,
  method TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_logs_lead_id ON delivery_logs (lead_id);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
