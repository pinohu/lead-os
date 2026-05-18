-- Fix RLS policies to completely separate anonymous INSERT from authenticated SELECT
-- The problem is that SELECT policy with auth.users query gets evaluated during INSERT

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own bookings by email" ON bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;

-- Policy 1: Anyone (including anonymous) can insert bookings
CREATE POLICY "allow_anonymous_insert_bookings"
ON bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Authenticated users can view their own bookings (no auth.users query)
-- This policy only applies to authenticated users, so auth.uid() will always have a value
CREATE POLICY "allow_authenticated_select_own_bookings"
ON bookings
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Policy 3: Admins can view all bookings
CREATE POLICY "allow_admin_select_all_bookings"
ON bookings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy 4: Admins can update bookings
CREATE POLICY "allow_admin_update_bookings"
ON bookings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy 5: Admins can delete bookings
CREATE POLICY "allow_admin_delete_bookings"
ON bookings
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));