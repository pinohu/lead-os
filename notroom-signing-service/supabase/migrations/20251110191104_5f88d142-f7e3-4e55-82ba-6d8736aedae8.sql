-- Create profiles table with company info and preferences
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  display_name TEXT,
  phone TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, phone, company_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'company_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for mail scans
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mail-scans',
  'mail-scans',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Storage policies for mail scans
CREATE POLICY "Users can view their own mail scans"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mail-scans' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can upload mail scans"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mail-scans' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can view all mail scans"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mail-scans' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete mail scans"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'mail-scans' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Create mail_items table
CREATE TABLE public.mail_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_application_id UUID REFERENCES public.crop_applications(id) ON DELETE SET NULL,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sender_name TEXT,
  sender_address TEXT,
  mail_type TEXT NOT NULL CHECK (mail_type IN ('letter', 'package', 'legal', 'certified', 'priority', 'other')),
  description TEXT,
  scan_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanned', 'forwarded', 'archived')),
  weight_oz NUMERIC(10, 2),
  dimensions TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  scanned_at TIMESTAMP WITH TIME ZONE,
  forwarded_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.mail_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own mail items
CREATE POLICY "Users can view own mail items"
ON public.mail_items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all mail items
CREATE POLICY "Admins can manage all mail items"
ON public.mail_items FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create mail_forwarding_requests table
CREATE TABLE public.mail_forwarding_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mail_item_id UUID REFERENCES public.mail_items(id) ON DELETE SET NULL,
  forwarding_address TEXT NOT NULL,
  shipping_method TEXT NOT NULL CHECK (shipping_method IN ('usps_first_class', 'usps_priority', 'ups_ground', 'fedex_2day', 'fedex_overnight')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'shipped', 'delivered', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  tracking_number TEXT,
  estimated_cost NUMERIC(10, 2),
  actual_cost NUMERIC(10, 2),
  notes TEXT,
  admin_notes TEXT
);

-- Enable RLS
ALTER TABLE public.mail_forwarding_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own forwarding requests
CREATE POLICY "Users can view own forwarding requests"
ON public.mail_forwarding_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create forwarding requests
CREATE POLICY "Users can create forwarding requests"
ON public.mail_forwarding_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all forwarding requests
CREATE POLICY "Admins can manage forwarding requests"
ON public.mail_forwarding_requests FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update mail_items.updated_at
CREATE OR REPLACE FUNCTION public.update_mail_items_updated_at()
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

CREATE TRIGGER update_mail_items_timestamp
BEFORE UPDATE ON public.mail_items
FOR EACH ROW
EXECUTE FUNCTION public.update_mail_items_updated_at();

-- Create trigger to update profiles.updated_at
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
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

CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

-- Add foreign key from crop_applications to profiles (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'crop_applications_user_id_fkey_profiles'
  ) THEN
    ALTER TABLE public.crop_applications
    DROP CONSTRAINT IF EXISTS crop_applications_user_id_fkey,
    ADD CONSTRAINT crop_applications_user_id_fkey_profiles
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX idx_mail_items_user_id ON public.mail_items(user_id);
CREATE INDEX idx_mail_items_status ON public.mail_items(status);
CREATE INDEX idx_mail_items_received_date ON public.mail_items(received_date DESC);
CREATE INDEX idx_forwarding_requests_user_id ON public.mail_forwarding_requests(user_id);
CREATE INDEX idx_forwarding_requests_status ON public.mail_forwarding_requests(status);
CREATE INDEX idx_profiles_user_id ON public.profiles(id);