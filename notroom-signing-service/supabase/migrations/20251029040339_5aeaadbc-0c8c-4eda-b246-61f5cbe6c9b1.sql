-- Restrict cleanup functions to service role only for security

-- Revoke public access to cleanup functions
REVOKE EXECUTE ON FUNCTION public.cleanup_old_verification_codes() FROM public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM public;

-- Grant access only to service role (admin/automated tasks)
GRANT EXECUTE ON FUNCTION public.cleanup_old_verification_codes() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_rate_limits() TO service_role;

-- Add comments explaining security rationale
COMMENT ON FUNCTION public.cleanup_old_verification_codes() IS 
  'Cleanup function restricted to service_role. Should be called via scheduled cron job only.';

COMMENT ON FUNCTION public.cleanup_old_rate_limits() IS 
  'Cleanup function restricted to service_role. Should be called via scheduled cron job only.';