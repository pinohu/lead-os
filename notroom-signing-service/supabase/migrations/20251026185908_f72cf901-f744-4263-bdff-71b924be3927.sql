-- Fix overly permissive RLS policy on bookings table
-- Drop the policy that allows any authenticated user to see all bookings
DROP POLICY IF EXISTS "allow_authenticated_select_own_bookings" ON public.bookings;

-- Create a properly scoped policy
-- Users can only see bookings matching their email address, or if they're an admin
CREATE POLICY "allow_users_select_own_bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);