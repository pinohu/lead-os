-- Create verification_codes table for email verification
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'booking',
  used BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (no public access)
CREATE POLICY "Service role only"
ON public.verification_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_code 
ON public.verification_codes(email, code, used, expires_at);

-- Create booking_rate_limits table for IP-based rate limiting
CREATE TABLE IF NOT EXISTS public.booking_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  email TEXT,
  attempts INTEGER NOT NULL DEFAULT 1,
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table
CREATE POLICY "Service role only"
ON public.booking_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for IP lookups
CREATE INDEX IF NOT EXISTS idx_booking_rate_limits_ip 
ON public.booking_rate_limits(ip_address, last_attempt_at);

-- Auto-cleanup old verification codes (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.verification_codes
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Auto-cleanup old rate limit records (keep last 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.booking_rate_limits
  WHERE last_attempt_at < NOW() - INTERVAL '24 hours'
  AND blocked_until IS NULL;
END;
$$;