-- Add Suitedash tracking columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS suitedash_contact_id text,
ADD COLUMN IF NOT EXISTS suitedash_project_id text,
ADD COLUMN IF NOT EXISTS suitedash_synced_at timestamp with time zone;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_suitedash_contact_id ON public.bookings(suitedash_contact_id);
CREATE INDEX IF NOT EXISTS idx_bookings_suitedash_project_id ON public.bookings(suitedash_project_id);

COMMENT ON COLUMN public.bookings.suitedash_contact_id IS 'ID of the contact created in Suitedash';
COMMENT ON COLUMN public.bookings.suitedash_project_id IS 'ID of the project created in Suitedash';
COMMENT ON COLUMN public.bookings.suitedash_synced_at IS 'Timestamp when last synced to Suitedash';