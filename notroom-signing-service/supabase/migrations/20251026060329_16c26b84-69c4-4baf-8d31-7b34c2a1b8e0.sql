-- Add SMS opt-in column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT false;

-- Add index for SMS queries
CREATE INDEX IF NOT EXISTS idx_bookings_sms_opt_in ON public.bookings(sms_opt_in) WHERE sms_opt_in = true;