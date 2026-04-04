-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  service TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_service CHECK (service IN ('ron', 'mobile', 'loan')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'))
);

-- Add length constraints
ALTER TABLE public.bookings 
  ADD CONSTRAINT name_length CHECK (char_length(name) <= 100 AND char_length(name) > 0),
  ADD CONSTRAINT email_length CHECK (char_length(email) <= 255 AND char_length(email) > 0),
  ADD CONSTRAINT phone_length CHECK (char_length(phone) <= 20 AND char_length(phone) > 0),
  ADD CONSTRAINT message_length CHECK (message IS NULL OR char_length(message) <= 1000);

-- Add email format validation
ALTER TABLE public.bookings
  ADD CONSTRAINT valid_email CHECK (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$');

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert bookings (public form submissions)
CREATE POLICY "Anyone can submit bookings"
ON public.bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated users can view bookings (for future admin panel)
CREATE POLICY "Authenticated users can view bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can update bookings
CREATE POLICY "Authenticated users can update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (true);

-- Only authenticated users can delete bookings
CREATE POLICY "Authenticated users can delete bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_bookings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bookings_timestamp
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_bookings_updated_at();