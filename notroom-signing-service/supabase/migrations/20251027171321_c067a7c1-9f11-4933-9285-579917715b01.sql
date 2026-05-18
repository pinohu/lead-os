-- Add WhatsApp opt-in to bookings table
ALTER TABLE public.bookings 
ADD COLUMN whatsapp_opt_in boolean DEFAULT false;

-- Add index for WhatsApp opt-in queries
CREATE INDEX idx_bookings_whatsapp_opt_in ON public.bookings(whatsapp_opt_in) WHERE whatsapp_opt_in = true;

-- Add WhatsApp number field (if different from phone)
ALTER TABLE public.bookings 
ADD COLUMN whatsapp_number text;

-- Comment for documentation
COMMENT ON COLUMN public.bookings.whatsapp_opt_in IS 'Customer preference for WhatsApp communications';
COMMENT ON COLUMN public.bookings.whatsapp_number IS 'WhatsApp number if different from phone number';