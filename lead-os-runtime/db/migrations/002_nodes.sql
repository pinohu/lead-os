-- db/migrations/002_nodes.sql
CREATE TABLE IF NOT EXISTS nodes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  webhook_url TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nodes_category ON nodes (category);
CREATE INDEX IF NOT EXISTS idx_nodes_active ON nodes (is_active) WHERE is_active = true;
