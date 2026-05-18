-- Fix search_path security issue for cleanup functions
DROP FUNCTION IF EXISTS cleanup_old_verification_codes();
DROP FUNCTION IF EXISTS cleanup_old_rate_limits();

CREATE OR REPLACE FUNCTION cleanup_old_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.verification_codes
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.booking_rate_limits
  WHERE last_attempt_at < NOW() - INTERVAL '24 hours'
  AND blocked_until IS NULL;
END;
$$;