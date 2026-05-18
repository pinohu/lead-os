-- Fix overly permissive RLS policy on bookings table
-- Replace USING(true) with email-based access control

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view bookings by email match" ON public.bookings;

-- Create a restrictive policy that enforces email matching at database level
-- This prevents any authenticated user from reading all bookings
CREATE POLICY "Users can view their own bookings by email"
ON public.bookings
FOR SELECT
USING (
  -- Allow users to see only bookings matching their authenticated email
  email = lower(trim((SELECT email FROM auth.users WHERE id = auth.uid())))
  -- OR allow admins to see all bookings
  OR has_role(auth.uid(), 'admin'::app_role)
);