-- Add AI agent columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ai_booked BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS call_transcript TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS agent_provider TEXT; -- 'insighto', 'thoughtly', 'human'

-- Create agent_configs table for managing voice AI settings
CREATE TABLE IF NOT EXISTS agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'insighto' or 'thoughtly'
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  intents JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default agent config
INSERT INTO agent_configs (provider, config, intents) VALUES
('insighto', 
 '{"voice": "professional", "language": "en-US", "transferNumber": "", "confidenceThreshold": 0.6}'::jsonb,
 '[
   {"name": "NOTARY_NOW", "description": "Urgent same-day notary service", "fields": ["name", "phone", "email", "location", "urgency"]},
   {"name": "APOSTILLE", "description": "Document authentication for international use", "fields": ["name", "phone", "email", "documentType", "country"]},
   {"name": "BUSINESS_FORMATION", "description": "LLC or Corporation formation", "fields": ["name", "phone", "email", "businessType", "state"]},
   {"name": "VEHICLE_TITLE", "description": "Vehicle title transfer", "fields": ["name", "phone", "email", "vehicleType"]},
   {"name": "OTHER", "description": "Other services requiring human assistance", "fields": ["name", "phone", "email", "inquiry"]}
 ]'::jsonb
);

-- Add index for faster AI booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_ai_booked ON bookings(ai_booked);
CREATE INDEX IF NOT EXISTS idx_bookings_agent_provider ON bookings(agent_provider);