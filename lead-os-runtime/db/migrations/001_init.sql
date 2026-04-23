CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  email TEXT,
  name TEXT,
  message TEXT,
  tenant_id TEXT DEFAULT 'default',
  created_at TIMESTAMP DEFAULT NOW()
);
