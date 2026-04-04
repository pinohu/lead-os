-- Add new fields to bookings table
ALTER TABLE public.bookings
  ADD COLUMN preferred_date DATE,
  ADD COLUMN preferred_time TEXT,
  ADD COLUMN document_type TEXT,
  ADD COLUMN number_of_signers INTEGER DEFAULT 1,
  ADD COLUMN location_address TEXT,
  ADD COLUMN urgency TEXT DEFAULT 'flexible';

-- Add constraints for new fields
ALTER TABLE public.bookings
  ADD CONSTRAINT valid_number_of_signers CHECK (number_of_signers > 0 AND number_of_signers <= 20),
  ADD CONSTRAINT valid_urgency CHECK (urgency IN ('flexible', 'within_week', 'within_24hrs', 'same_day')),
  ADD CONSTRAINT location_address_length CHECK (location_address IS NULL OR char_length(location_address) <= 300),
  ADD CONSTRAINT document_type_length CHECK (document_type IS NULL OR char_length(document_type) <= 100);