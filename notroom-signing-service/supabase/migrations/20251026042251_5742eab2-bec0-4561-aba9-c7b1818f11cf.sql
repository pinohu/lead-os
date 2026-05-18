-- Fix RLS policy to allow anonymous booking submissions
-- The issue is that the SELECT policy tries to query auth.users which anonymous users can't access

-- Drop the existing policy that's causing issues
DROP POLICY IF EXISTS "Users can view their own bookings by email" ON bookings;

-- Create a new policy that handles both authenticated and anonymous users
CREATE POLICY "Users can view their own bookings by email"
ON bookings
FOR SELECT
USING (
  -- Allow if user is authenticated and email matches
  (auth.uid() IS NOT NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  -- Or if user is an admin
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Ensure anonymous users can insert bookings
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;

CREATE POLICY "Anyone can create bookings"
ON bookings
FOR INSERT
WITH CHECK (true);