-- Add call tracking columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS marketing_source TEXT,
ADD COLUMN IF NOT EXISTS call_duration INTEGER,
ADD COLUMN IF NOT EXISTS call_recording_url TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- Create integration_config table for storing tool configurations
CREATE TABLE IF NOT EXISTS public.integration_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool TEXT NOT NULL UNIQUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create call_events table for detailed call analytics
CREATE TABLE IF NOT EXISTS public.call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  tool TEXT NOT NULL,
  tracking_number TEXT,
  caller_number TEXT,
  duration INTEGER,
  recording_url TEXT,
  transcript TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.integration_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_events ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for integration_config
CREATE POLICY "Admins can manage integration config"
ON public.integration_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can view all call events
CREATE POLICY "Admins can view all call events"
ON public.call_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert call events (from webhooks)
CREATE POLICY "Service role can insert call events"
ON public.call_events
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_marketing_source ON public.bookings(marketing_source);
CREATE INDEX IF NOT EXISTS idx_bookings_tracking_number ON public.bookings(tracking_number);
CREATE INDEX IF NOT EXISTS idx_call_events_booking_id ON public.call_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_call_events_created_at ON public.call_events(created_at DESC);

-- Add updated_at trigger for integration_config
CREATE TRIGGER update_integration_config_updated_at
BEFORE UPDATE ON public.integration_config
FOR EACH ROW
EXECUTE FUNCTION public.update_bookings_updated_at();