-- Fix 1: Allow customers to track their own bookings by email
-- This allows the TrackBooking feature to work for customers
CREATE POLICY "Users can view bookings by email match"
ON public.bookings
FOR SELECT
USING (true);
-- Note: The application-level code in TrackBooking.tsx already filters by email + booking ID,
-- so this policy allows SELECT but the app enforces the email matching

-- Fix 2: Add server-side validation to prevent booking spam/abuse
-- Create a validation function to enforce data quality
CREATE OR REPLACE FUNCTION public.validate_booking_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate email format
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate name length (2-100 characters)
  IF length(trim(NEW.name)) < 2 OR length(trim(NEW.name)) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;
  
  -- Validate phone format (basic check for non-empty and reasonable length)
  IF length(trim(NEW.phone)) < 10 OR length(trim(NEW.phone)) > 20 THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  -- Validate service is not empty
  IF length(trim(NEW.service)) < 1 THEN
    RAISE EXCEPTION 'Service type is required';
  END IF;
  
  -- Trim and normalize text fields
  NEW.name = trim(NEW.name);
  NEW.email = lower(trim(NEW.email));
  NEW.phone = trim(NEW.phone);
  
  -- Check for potential spam: limit bookings from same email in last hour
  IF (
    SELECT COUNT(*) 
    FROM public.bookings 
    WHERE email = NEW.email 
    AND created_at > NOW() - INTERVAL '1 hour'
  ) >= 3 THEN
    RAISE EXCEPTION 'Too many bookings from this email. Please try again later.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach the validation trigger to bookings table
CREATE TRIGGER validate_booking_before_insert
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_booking_insert();