-- Add payment-related status values to bookings table
-- This extends the existing status field to support payment tracking

COMMENT ON COLUMN bookings.status IS 'Booking status: pending, confirmed, completed, cancelled, payment_pending, paid';
