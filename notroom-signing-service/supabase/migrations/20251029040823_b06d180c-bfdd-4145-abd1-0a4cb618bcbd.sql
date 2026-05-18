-- Fix critical RLS policy vulnerabilities

-- 1. Fix verification_codes - restrict to service role only
DROP POLICY IF EXISTS "Service role only" ON public.verification_codes;
CREATE POLICY "Service role only" ON public.verification_codes
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- 2. Fix booking_rate_limits - restrict to service role only
DROP POLICY IF EXISTS "Service role only" ON public.booking_rate_limits;
CREATE POLICY "Service role only" ON public.booking_rate_limits
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- 3. Fix agent_configs - restrict to admins only
DROP POLICY IF EXISTS "Users can read agent configs" ON public.agent_configs;
DROP POLICY IF EXISTS "Users can update agent configs" ON public.agent_configs;
CREATE POLICY "Admins can manage agent configs" ON public.agent_configs
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Fix call_events - service role only for insert
DROP POLICY IF EXISTS "Service role can insert call events" ON public.call_events;
CREATE POLICY "Service role can insert call events" ON public.call_events
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- 5. Fix bookings SELECT - only allow users to see their own bookings or admins
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT
  USING (
    email = auth.jwt()->>'email' OR
    public.has_role(auth.uid(), 'admin')
  );

-- Prevent anonymous SELECT on bookings
CREATE POLICY "Prevent anonymous SELECT on bookings" ON public.bookings
  FOR SELECT
  USING (auth.role() != 'anon');